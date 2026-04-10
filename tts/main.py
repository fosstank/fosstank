import base64
import struct
import json
import os
import numpy as np # pyright: ignore[reportMissingTypeStubs]
from voxcpm import VoxCPM # pyright: ignore[reportMissingTypeStubs]
from typing import NamedTuple
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import uvicorn

DATA_DIR = os.path.join(os.environ.get("HOME", "/root"), ".cache", "tts")
VOICES_FILE = "voices.json"
VOICES_DIR = "voices"

# Optimize set to false because of this: https://github.com/OpenBMB/VoxCPM/issues/107
# This entire service can be sped up using the nano-vllm backend instead of pytorch,
# but for now this is a fine workaround
model = VoxCPM.from_pretrained("openbmb/VoxCPM1.5", optimize=False, load_denoiser=False) # pyright: ignore[reportUnknownMemberType]

Voice = NamedTuple("Voice", [("reference_audio", str | None), ("reference_text", str | None)])
voices: dict[str, Voice] = {}


def load_voices() -> None:
    path = os.path.join(DATA_DIR, VOICES_FILE)
    if not os.path.exists(path):
        save_voices()
        return
    with open(path) as f:
        records: dict[str, dict] = json.load(f)
    for title, r in records.items():
        voices[title] = Voice(reference_audio=r.get("reference_audio"), reference_text=r.get("reference_text"))


def save_voices() -> None:
    with open(os.path.join(DATA_DIR, VOICES_FILE), "w") as f:
        json.dump(
            {title: {"reference_audio": v.reference_audio, "reference_text": v.reference_text}
             for title, v in voices.items()},
            f, indent="\t"
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    os.makedirs(os.path.join(DATA_DIR, VOICES_DIR), exist_ok=True)
    load_voices()
    # if "none" not in voices:
        # voices["none"] = Voice(None, None)
    yield


app = FastAPI(lifespan=lifespan)

class TTSRequest(BaseModel):
    prompt: str

class SyncVoiceRequest(BaseModel):
    reference_audio: str | None = None  # base64-encoded WAV
    reference_text: str | None = None

def _build_wav(sample_rate: int, audio_data: bytes, num_channels: int = 1, bits_per_sample: int = 16) -> bytes:
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = len(audio_data)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + data_size,
        b"WAVE",
        b"fmt ", 16,
        1,               # PCM
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data", data_size,
    )
    return header + audio_data

@app.post("/tts/{voiceTitle}")
def tts_handler(voiceTitle: str, body: TTSRequest) -> Response:
    sample_rate: int = model.tts_model.sample_rate # pyright: ignore[reportUnknownMemberType]

    voice = voices.get(voiceTitle)
    if voice is None:
        raise HTTPException(status_code=400, detail="Voice not found")
    
    text = body.prompt
    if text == "":
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    reference_text: str | None = voice.reference_text
    # if voice.reference_audio is None and reference_text is not None:
    #     text = "(" + reference_text + ")" + text
    #     reference_text = None

    audio = model.generate( # pyright: ignore[reportUnknownMemberType]
        text=text,
        # reference_wav_path=voice.reference_audio,
        prompt_wav_path=voice.reference_audio,
        prompt_text=reference_text,
        cfg_value=2.0,
        inference_timesteps=10,
        normalize=False,
        denoise=False,
        retry_badcase=True,
        retry_badcase_max_times=3,
        retry_badcase_ratio_threshold=6.0,
    )
    audio_data = (audio * 32767).astype(np.int16).tobytes()
    return Response(content=_build_wav(sample_rate, audio_data), media_type="audio/wav")


@app.put("/voices/{title}")
async def put_voice(title: str, body: SyncVoiceRequest) -> None:
    existing = voices.get(title)
    reference_audio: str | None = existing.reference_audio if existing else None
    if body.reference_audio is not None:
        reference_audio = os.path.join(DATA_DIR, VOICES_DIR, f"{title}.wav")
        with open(reference_audio, "wb") as f:
            f.write(base64.b64decode(body.reference_audio))
    voices[title] = Voice(reference_audio=reference_audio, reference_text=body.reference_text)
    save_voices()


@app.delete("/voices/{title}")
async def delete_voice(title: str) -> None:
    reference_audio = os.path.join(DATA_DIR, VOICES_DIR, f"{title}.wav")
    if os.path.exists(reference_audio):
        os.unlink(reference_audio)
    voices.pop(title, None)
    save_voices()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)