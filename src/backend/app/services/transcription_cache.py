from collections import OrderedDict
from copy import deepcopy
from hashlib import sha256
from threading import Lock
from time import monotonic


_CACHE_TTL_SECONDS = 30 * 60
_CACHE_MAX_ITEMS = 128
_cache = OrderedDict()
_cache_lock = Lock()


def audio_cache_key(content: bytes) -> str:
    return sha256(content).hexdigest()


def cache_transcription(content: bytes, result: dict) -> None:
    key = audio_cache_key(content)
    now = monotonic()
    with _cache_lock:
        expired = [cache_key for cache_key, (expires_at, _) in _cache.items() if expires_at <= now]
        for cache_key in expired:
            _cache.pop(cache_key, None)
        _cache[key] = (now + _CACHE_TTL_SECONDS, deepcopy(result))
        _cache.move_to_end(key)
        while len(_cache) > _CACHE_MAX_ITEMS:
            _cache.popitem(last=False)


def get_cached_transcription(content: bytes):
    key = audio_cache_key(content)
    now = monotonic()
    with _cache_lock:
        cached = _cache.get(key)
        if cached is None:
            return None
        expires_at, result = cached
        if expires_at <= now:
            _cache.pop(key, None)
            return None
        _cache.move_to_end(key)
        return deepcopy(result)
