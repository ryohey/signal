"""
Audio rendering endpoint.

Renders MIDI data to high-quality WAV audio using FluidSynth.
"""

import base64
import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.audio_renderer import (
    render_midi_to_wav,
    list_soundfonts,
    AudioRenderError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


class RenderRequest(BaseModel):
    """Request to render MIDI to audio."""
    midi_base64: str  # Base64-encoded MIDI data
    soundfont: str | None = None  # Optional soundfont name


class SoundfontsResponse(BaseModel):
    """List of available soundfonts."""
    soundfonts: list[str]
    default: str


@router.post("/render")
async def render_audio(request: RenderRequest):
    """
    Render MIDI data to WAV audio using FluidSynth.

    Request body:
        midi_base64: Base64-encoded MIDI file data
        soundfont: Optional soundfont filename (uses default if not specified)

    Returns:
        WAV audio file (audio/wav content type)
    """
    try:
        # Decode MIDI data
        try:
            midi_data = base64.b64decode(request.midi_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 MIDI data: {e}")

        logger.info(f"Rendering MIDI ({len(midi_data)} bytes) with soundfont: {request.soundfont or 'default'}")

        # Render to WAV
        wav_data = render_midi_to_wav(
            midi_data=midi_data,
            soundfont_name=request.soundfont,
        )

        # Return WAV file
        return Response(
            content=wav_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "attachment; filename=rendered.wav",
            },
        )

    except AudioRenderError as e:
        logger.error(f"Render failed: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected render error: {e}")
        raise HTTPException(status_code=500, detail=f"Render failed: {str(e)}")


@router.get("/render/soundfonts", response_model=SoundfontsResponse)
async def get_soundfonts():
    """
    Get list of available soundfonts.

    Returns:
        soundfonts: List of available soundfont filenames
        default: The default soundfont name
    """
    from app.services.audio_renderer import DEFAULT_SOUNDFONT

    soundfonts = list_soundfonts()
    return SoundfontsResponse(
        soundfonts=soundfonts,
        default=DEFAULT_SOUNDFONT,
    )
