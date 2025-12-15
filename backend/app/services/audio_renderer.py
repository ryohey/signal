"""
Audio rendering service using FluidSynth.

Renders MIDI data to WAV audio using a SoundFont.
"""

import os
import uuid
import subprocess
import tempfile
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Default soundfont path (relative to backend directory)
SOUNDFONT_DIR = Path(__file__).parent.parent.parent / "soundfonts"
DEFAULT_SOUNDFONT = "Live HQ Natural SoundFont GM.sf2"


class AudioRenderError(Exception):
    """Raised when audio rendering fails."""
    pass


def get_soundfont_path(soundfont_name: str | None = None) -> Path:
    """Get the path to a soundfont file."""
    name = soundfont_name or DEFAULT_SOUNDFONT
    path = SOUNDFONT_DIR / name

    if not path.exists():
        # List available soundfonts for error message
        available = list(SOUNDFONT_DIR.glob("*.sf2")) if SOUNDFONT_DIR.exists() else []
        available_names = [f.name for f in available]
        raise AudioRenderError(
            f"Soundfont not found: {path}. "
            f"Available soundfonts: {available_names or 'none'}"
        )

    return path


def render_midi_to_wav(
    midi_data: bytes,
    soundfont_name: str | None = None,
    sample_rate: int = 44100,
    gain: float = 1.0,
) -> bytes:
    """
    Render MIDI data to WAV audio using FluidSynth.

    Args:
        midi_data: Raw MIDI file bytes
        soundfont_name: Name of soundfont file in soundfonts directory (optional)
        sample_rate: Audio sample rate (default 44100)
        gain: Audio gain/volume (default 1.0)

    Returns:
        WAV file bytes

    Raises:
        AudioRenderError: If rendering fails
    """
    soundfont_path = get_soundfont_path(soundfont_name)

    # Create temp files for MIDI input and WAV output
    temp_dir = tempfile.gettempdir()
    job_id = str(uuid.uuid4())
    midi_path = Path(temp_dir) / f"{job_id}.mid"
    wav_path = Path(temp_dir) / f"{job_id}.wav"

    try:
        # Write MIDI data to temp file
        midi_path.write_bytes(midi_data)
        logger.debug(f"Wrote MIDI to {midi_path} ({len(midi_data)} bytes)")

        # Build FluidSynth command
        # -ni: non-interactive, no MIDI input
        # -F: render to file
        # -r: sample rate
        # -g: gain
        # Quality settings:
        # - synth.polyphony=512: more simultaneous voices (default 256)
        # - synth.reverb.active=1: enable reverb
        # - synth.chorus.active=1: enable chorus
        cmd = [
            "fluidsynth",
            "-ni",
            "-F", str(wav_path),
            "-r", str(sample_rate),
            "-g", str(gain),
            "-o", "synth.polyphony=512",
            "-o", "synth.reverb.active=1",
            "-o", "synth.chorus.active=1",
            str(soundfont_path),
            str(midi_path),
        ]

        logger.info(f"Running FluidSynth: {' '.join(cmd)}")

        # Run FluidSynth
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,  # 60 second timeout
        )

        if result.returncode != 0:
            logger.error(f"FluidSynth stderr: {result.stderr}")
            raise AudioRenderError(
                f"FluidSynth failed with code {result.returncode}: {result.stderr}"
            )

        # Check output file exists
        if not wav_path.exists():
            raise AudioRenderError("FluidSynth did not produce output file")

        # Read WAV data
        wav_data = wav_path.read_bytes()
        logger.info(f"Rendered WAV: {len(wav_data)} bytes")

        return wav_data

    except subprocess.TimeoutExpired:
        raise AudioRenderError("FluidSynth timed out after 60 seconds")
    except FileNotFoundError:
        raise AudioRenderError(
            "FluidSynth not found. Install with: brew install fluidsynth (Mac) "
            "or apt-get install fluidsynth (Linux)"
        )
    finally:
        # Clean up temp files
        if midi_path.exists():
            midi_path.unlink()
        if wav_path.exists():
            wav_path.unlink()


def list_soundfonts() -> list[str]:
    """List available soundfont files."""
    if not SOUNDFONT_DIR.exists():
        return []
    return [f.name for f in SOUNDFONT_DIR.glob("*.sf2")]
