import asyncio
import logging
import os
import re
import tempfile
from pathlib import Path
from threading import Lock

from fastapi import APIRouter, File, HTTPException, UploadFile
from app.services.transcription_cache import cache_transcription

router = APIRouter(prefix="/api", tags=["transcription"])

MODEL_NAME = "small.en"
SUPPORTED_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a", ".ogg", ".flac", ".mp4", ".mpeg", ".mpga"}
SAMPLE_RATE = 16000
PAUSE_THRESHOLD_SECONDS = 0.3
DEBUG_TRANSCRIPTION = os.getenv("DEBUG_TRANSCRIPTION", "false").strip().lower() == "true"
logger = logging.getLogger(__name__)
_model = None
_model_lock = Lock()
FILLER_WORDS = {"um", "uh", "ah", "er", "erm", "hmm", "yeah", "well", "so", "like"}
WORD_PATTERN = re.compile(r"[^\W_]+(?:['’][^\W_]+)*", re.UNICODE)


def calculate_pause_metrics(words, threshold=PAUSE_THRESHOLD_SECONDS):
    pauses = [
        float(current["start"]) - float(previous["end"])
        for previous, current in zip(words, words[1:])
        if float(current["start"]) - float(previous["end"]) >= threshold
    ]
    pause_total = sum(pauses)
    total = round(pause_total, 1)
    return {
        "pause_count": len(pauses),
        "total_pause_seconds": total,
        "average_pause_seconds": round(pause_total / len(pauses), 1) if pauses else 0.0,
    }


def calculate_repetition_count(words):
    count = 0
    index = 0
    while index < len(words) - 1:
        repeated_phrase_length = next(
            (
                length
                for length in range(min(4, (len(words) - index) // 2), 0, -1)
                if words[index:index + length] == words[index + length:index + 2 * length]
            ),
            None,
        )
        if repeated_phrase_length is None:
            index += 1
            continue

        repetitions = 1
        while words[index:index + repeated_phrase_length] == words[
            index + repetitions * repeated_phrase_length:index + (repetitions + 1) * repeated_phrase_length
        ]:
            repetitions += 1
        count += repetitions - 1
        index += repetitions * repeated_phrase_length
    return count


def calculate_linguistic_metrics(text, segments, raw_words):
    raw_word_tokens = [
        token
        for raw_word in raw_words
        for token in WORD_PATTERN.findall(raw_word["word"].casefold())
    ]
    duration = (
        float(raw_words[-1]["end"]) - float(raw_words[0]["start"])
        if raw_words else 0.0
    )
    speech_rate = round(len(raw_word_tokens) / (duration / 60)) if duration > 0 else None
    return {
        "speech_rate": speech_rate,
        **calculate_pause_metrics(raw_words),
        "hesitation_count": sum(word in FILLER_WORDS for word in raw_word_tokens),
        "repetition_count": calculate_repetition_count(raw_word_tokens),
        "segment_count": len(segments),
    }


def unavailable_linguistic_metrics():
    return {
        "speech_rate": None,
        "pause_count": None,
        "total_pause_seconds": None,
        "average_pause_seconds": None,
        "hesitation_count": None,
        "repetition_count": None,
        "segment_count": None,
    }


def _get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel

                _model = WhisperModel(
                    MODEL_NAME,
                    device="cpu",
                    compute_type="int8",
                    local_files_only=True,
                )
    return _model


def _decode_audio_to_pcm(audio_path):
    import av
    import numpy as np

    frames = []
    with av.open(audio_path) as container:
        audio_stream = next((stream for stream in container.streams if stream.type == "audio"), None)
        if audio_stream is None:
            raise ValueError("The uploaded file has no audio stream.")
        resampler = av.AudioResampler(format="fltp", layout="mono", rate=SAMPLE_RATE)
        for frame in container.decode(audio_stream):
            frames.extend(resampled.to_ndarray().reshape(-1) for resampled in resampler.resample(frame))
        frames.extend(resampled.to_ndarray().reshape(-1) for resampled in resampler.resample(None))

    if not frames:
        raise ValueError("The uploaded audio could not be decoded.")
    return np.concatenate(frames).astype(np.float32, copy=False)


def _transcribe_audio_file(audio_path):
    from faster_whisper.vad import get_speech_timestamps

    audio = _decode_audio_to_pcm(audio_path)
    vad_chunks = get_speech_timestamps(audio, sampling_rate=SAMPLE_RATE)
    if DEBUG_TRANSCRIPTION:
        logger.info(
            "Silero VAD speech chunks: %s",
            [
                {"start": chunk["start"] / SAMPLE_RATE, "end": chunk["end"] / SAMPLE_RATE}
                for chunk in vad_chunks
            ],
        )

    model = _get_model()
    all_segments = []
    all_words = []
    transcript_parts = []
    prompt = (
        "Transcribe exactly as spoken. Preserve filler words like um, uh, ah, repeated words, "
        "false starts, and self-corrections. Do not paraphrase."
    )

    for chunk in vad_chunks:
        chunk_start = int(chunk["start"])
        chunk_end = int(chunk["end"])
        chunk_offset = chunk_start / SAMPLE_RATE
        chunk_audio = audio[chunk_start:chunk_end]
        if chunk_audio.size == 0:
            continue

        chunk_segments, _ = model.transcribe(
            chunk_audio,
            language="en",
            task="transcribe",
            word_timestamps=True,
            condition_on_previous_text=False,
            initial_prompt=prompt,
        )
        chunk_segments = list(chunk_segments)
        transcript_parts.append("".join(segment.text for segment in chunk_segments).strip())
        all_segments.extend(
            {
                "start": float(segment.start) + chunk_offset,
                "end": float(segment.end) + chunk_offset,
                "text": segment.text,
            }
            for segment in chunk_segments
        )
        all_words.extend(
            {
                "word": word.word,
                "start": float(word.start) + chunk_offset,
                "end": float(word.end) + chunk_offset,
            }
            for segment in chunk_segments
            for word in (segment.words or [])
        )

    transcript = " ".join(part for part in transcript_parts if part).strip()
    if DEBUG_TRANSCRIPTION:
        logger.info("Transcription raw words with timestamps: %s", all_words)

    try:
        metrics = calculate_linguistic_metrics(transcript, all_segments, all_words)
    except Exception:
        logger.exception("Could not calculate transcription metrics")
        metrics = unavailable_linguistic_metrics()
    return {
        "text": transcript,
        "segments": all_segments,
        "raw_words": all_words,
        "metrics": metrics,
    }


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported audio file. Upload WebM, WAV, MP3, M4A, OGG, or FLAC audio.")

    temporary_path = None
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary_file:
            temporary_file.write(content)
            temporary_path = temporary_file.name

        transcription = await asyncio.to_thread(_transcribe_audio_file, temporary_path)
        cache_transcription(content, transcription)
        return transcription
    except HTTPException:
        raise
    except ImportError as error:
        raise HTTPException(status_code=500, detail="Faster-Whisper dependencies are missing. Install the backend requirements and restart the server.") from error
    except Exception as error:
        message = str(error)
        if any(word in message.lower() for word in ("model", "download", "snapshot")):
            detail = "The Faster-Whisper small.en model is unavailable locally. Install or cache it before starting offline transcription."
        else:
            detail = "Audio transcription failed. Check that the file contains valid audio and try again."
        raise HTTPException(status_code=500, detail=detail) from error
    finally:
        if temporary_path:
            try:
                os.remove(temporary_path)
            except OSError:
                pass
        await file.close()
