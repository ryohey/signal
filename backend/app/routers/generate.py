import re
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    GenerateRequest,
    GenerateResponse,
    RegenerateRequest,
    RegenerateResponse,
    TrackData,
    SongMetadata,
)
from app.services.llm import generate_midi_code, generate_single_track_code
from app.services.midi_executor import (
    execute_midi_generation,
    midi_to_base64,
    MIDIExecutionError,
)

router = APIRouter()

# Mapping of track names to MIDI channels and program numbers
TRACK_CONFIG = {
    "drums": {"channel": 9, "program": 0},
    "bass": {"channel": 0, "program": 33},  # Electric Bass (finger)
    "guitar": {"channel": 1, "program": 25},  # Acoustic Guitar (steel)
    "keys": {"channel": 2, "program": 4},  # Electric Piano
    "melody": {"channel": 3, "program": 73},  # Flute (for vocal melody)
}

MAX_RETRIES = 2


def parse_prompt(prompt: str) -> dict:
    """Extract tempo, key, and style from prompt."""
    # Simple parsing - can be enhanced later
    tempo = 120
    key = "Am"

    prompt_lower = prompt.lower()

    # Try to extract BPM
    bpm_match = re.search(r"(\d+)\s*bpm", prompt_lower)
    if bpm_match:
        tempo = int(bpm_match.group(1))

    # Try to extract key
    key_match = re.search(r"\b([A-G][#b]?m?)\b", prompt)
    if key_match:
        key = key_match.group(1)

    return {"tempo": tempo, "key": key, "style": prompt}


@router.post("/generate", response_model=GenerateResponse)
async def generate_song(request: GenerateRequest):
    """Generate a multi-track song from a text prompt."""

    params = parse_prompt(request.prompt)
    last_error = None

    # Retry loop for transient generation errors
    for attempt in range(MAX_RETRIES):
        try:
            # Generate code from Claude
            code = await generate_midi_code(
                prompt=params["style"], tempo=params["tempo"], key=params["key"]
            )

            # Execute the code
            midi_files = execute_midi_generation(
                code=code, tempo=params["tempo"], key=params["key"]
            )

            # Convert to response format
            tracks = []
            for name, midi_bytes in midi_files.items():
                config = TRACK_CONFIG.get(name, {"channel": 0, "program": 0})
                tracks.append(
                    TrackData(
                        name=name,
                        midi_data=midi_to_base64(midi_bytes),
                        channel=config["channel"],
                        program_number=config["program"],
                    )
                )

            return GenerateResponse(
                tracks=tracks,
                metadata=SongMetadata(
                    tempo=params["tempo"], key=params["key"], time_signature="4/4"
                ),
                message=f"Generated {len(tracks)} track(s)",
            )

        except MIDIExecutionError as e:
            last_error = e
            error_msg = str(e).lower()
            # Retry on transient generation errors
            if "overlapping notes" in error_msg or "syntax error" in error_msg:
                continue
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    # If we exhausted retries
    raise HTTPException(
        status_code=422,
        detail=f"Generation failed after {MAX_RETRIES} attempts: {str(last_error)}",
    )


@router.post("/regenerate", response_model=RegenerateResponse)
async def regenerate_track(request: RegenerateRequest):
    """Regenerate a single track based on instruction."""

    context = request.context
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            # Generate code for single track
            code = await generate_single_track_code(
                track_name=request.track_name,
                instruction=request.instruction,
                context=context,
            )

            # Execute the code
            midi_files = execute_midi_generation(
                code=code,
                tempo=context.get("tempo", 120),
                key=context.get("key", "Am"),
            )

            # Get the generated track
            track_name = request.track_name.lower()
            if track_name not in midi_files:
                # Try to find any generated file
                if midi_files:
                    track_name = list(midi_files.keys())[0]
                else:
                    raise MIDIExecutionError("No MIDI file was generated")

            midi_bytes = midi_files[track_name]
            config = TRACK_CONFIG.get(track_name, {"channel": 0, "program": 0})

            return RegenerateResponse(
                track=TrackData(
                    name=request.track_name,
                    midi_data=midi_to_base64(midi_bytes),
                    channel=config["channel"],
                    program_number=config["program"],
                ),
                message=f"Regenerated {request.track_name} track",
            )

        except MIDIExecutionError as e:
            last_error = e
            error_msg = str(e).lower()
            # Retry on transient generation errors
            if "overlapping notes" in error_msg or "syntax error" in error_msg:
                continue
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Regeneration failed: {str(e)}"
            )

    raise HTTPException(
        status_code=422,
        detail=f"Regeneration failed after {MAX_RETRIES} attempts: {str(last_error)}",
    )
