import soundfile as sf # pyright: ignore[reportMissingTypeStubs]
from voxcpm import VoxCPM # pyright: ignore[reportMissingTypeStubs]
from typing import NamedTuple
from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
import uvicorn
import io

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

@app.post("/tts/{voice}")
def tts_handler(voice: str, body: TTSRequest) -> Response:
    # Non-streaming
    audio_data = model.generate( # pyright: ignore[reportUnknownMemberType]
        text=body.prompt,
        prompt_wav_path=voices[voice].wav_path,      # optional: path to a prompt speech for voice cloning
        prompt_text=voices[voice].text,          # optional: reference text
        cfg_value=2.0,             # LM guidance on LocDiT, higher for better adherence to the prompt, but maybe worse
        inference_timesteps=10,   # LocDiT inference timesteps, higher for better result, lower for fast speed
        normalize=False,           # enable external TN tool
        denoise=False,             # enable external Denoise tool
        retry_badcase=True,        # enable retrying mode for some bad cases (unstoppable)
        retry_badcase_max_times=3,  # maximum retrying times
        retry_badcase_ratio_threshold=6.0, # maximum length restriction for bad case detection (simple but effective), it could be adjusted for slow pace speech
    )

    buffer = io.BytesIO()
    sf.write(buffer, audio_data, model.tts_model.sample_rate, format="OGG") # pyright: ignore[reportUnknownMemberType]

    return Response(
        content=buffer.getvalue(),
        media_type="audio/ogg"
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Streaming
# chunks = []
# for chunk in model.generate_streaming(
#     text = "Streaming text to speech is easy with VoxCPM!",
#     # supports same args as above
# ):
#     chunks.append(chunk)
# wav = np.concatenate(chunks)

# sf.write("output_streaming.wav", wav, 16000)
# print("saved: output_streaming.wav")