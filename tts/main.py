import struct
import numpy as np # pyright: ignore[reportMissingTypeStubs]
from voxcpm import VoxCPM # pyright: ignore[reportMissingTypeStubs]
from typing import Generator, NamedTuple
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Optimize set to false because of this: https://github.com/OpenBMB/VoxCPM/issues/107
# This entire service can be sped up using the nano-vllm backend instead of pytorch,
# but for now this is a fine workaround
model = VoxCPM.from_pretrained("openbmb/VoxCPM1.5", optimize=False) # pyright: ignore[reportUnknownMemberType]

Voice = NamedTuple("Voice", [("wav_path", str | None), ("text", str | None)])
voices = {
    "none": Voice(None, None),
}

class TTSRequest(BaseModel):
    prompt: str

def _wav_header(sample_rate: int, num_channels: int = 1, bits_per_sample: int = 16) -> bytes:
    # Use 0xFFFFFFFF for both RIFF and data chunk sizes to signal unknown/streaming length
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    return struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 0xFFFFFFFF,
        b"WAVE",
        b"fmt ", 16,
        1,               # PCM
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data", 0xFFFFFFFF,
    )

@app.post("/tts/{voice}")
def tts_handler(voice: str, body: TTSRequest) -> StreamingResponse:
    sample_rate: int = model.tts_model.sample_rate # pyright: ignore[reportUnknownMemberType]

    def generate() -> Generator[bytes, None, None]:
        yield _wav_header(sample_rate)
        for chunk in model.generate_streaming( # pyright: ignore[reportUnknownMemberType]
            text=body.prompt,
            prompt_wav_path=voices[voice].wav_path,
            prompt_text=voices[voice].text,
            cfg_value=2.0,
            inference_timesteps=10,
            normalize=False,
            denoise=False,
            retry_badcase=True,
            retry_badcase_max_times=3,
            retry_badcase_ratio_threshold=6.0,
        ):
            yield (chunk * 32767).astype(np.int16).tobytes()

    return StreamingResponse(generate(), media_type="audio/wav")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)