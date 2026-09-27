from pathlib import Path
from threading import Lock

import torch
from torch import nn
from safetensors.torch import load_file
from transformers import AutoModel, AutoTokenizer


BASE_MODEL = "microsoft/deberta-v3-base"
CHECKPOINT_PATH = (
    Path(__file__).resolve().parents[1]
    / "models"
    / "deberta_v3_attention_mean"
    / "checkpoint-264"
    / "model.safetensors"
)
LABELS = {0: "Healthy", 1: "Alzheimer's"}

_tokenizer = None
_model = None
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_load_lock = Lock()


class DebertaAttentionMeanClassifier(nn.Module):
    def __init__(self, deberta):
        super().__init__()
        self.deberta = deberta
        hidden_size = deberta.config.hidden_size
        self.attention = nn.Sequential(
            nn.Linear(hidden_size, 128),
            nn.Tanh(),
            nn.Linear(128, 1),
        )
        self.dropout = nn.Dropout(0.30)
        self.classifier = nn.Linear(hidden_size * 2, 2)

    def forward(self, input_ids, attention_mask):
        hidden_states = self.deberta(
            input_ids=input_ids,
            attention_mask=attention_mask,
        ).last_hidden_state

        attention_scores = self.attention(hidden_states).squeeze(-1)
        attention_scores = attention_scores.masked_fill(attention_mask == 0, torch.finfo(attention_scores.dtype).min)
        attention_weights = torch.softmax(attention_scores, dim=1)
        attention_pooled = torch.sum(hidden_states * attention_weights.unsqueeze(-1), dim=1)

        mask = attention_mask.unsqueeze(-1).to(hidden_states.dtype)
        mean_pooled = torch.sum(hidden_states * mask, dim=1) / mask.sum(dim=1).clamp(min=1)

        combined = torch.cat((attention_pooled, mean_pooled), dim=1)
        return self.classifier(self.dropout(combined))


def load_predictor():
    """Load the pretrained tokenizer and trained checkpoint once for API inference."""
    global _tokenizer, _model
    if _model is not None and _tokenizer is not None:
        return

    with _load_lock:
        if _model is not None and _tokenizer is not None:
            return
        if not CHECKPOINT_PATH.is_file():
            raise FileNotFoundError(f"Production model checkpoint not found: {CHECKPOINT_PATH}")

        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
        deberta = AutoModel.from_pretrained(BASE_MODEL, low_cpu_mem_usage=True)
        model = DebertaAttentionMeanClassifier(deberta)
        state_dict = load_file(str(CHECKPOINT_PATH), device="cpu")
        model.load_state_dict(state_dict, strict=True)
        model.to(device=_device, dtype=torch.float32)
        model.eval()

        _tokenizer = tokenizer
        _model = model


def predict_alzheimers(text: str):
    load_predictor()
    tokens = _tokenizer(
        text,
        max_length=256,
        truncation=True,
        padding="max_length",
        return_tensors="pt",
    )
    input_ids = tokens["input_ids"].to(_device)
    attention_mask = tokens["attention_mask"].to(_device)

    with torch.inference_mode():
        logits = _model(input_ids=input_ids, attention_mask=attention_mask)
        probabilities = torch.softmax(logits, dim=-1)
        class_id = int(torch.argmax(probabilities, dim=-1).item())
        confidence = float(probabilities[0, class_id].item() * 100)

    return {
        "prediction": LABELS[class_id],
        "confidence": confidence,
    }
