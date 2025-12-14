import re
import json
import asyncio
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    GenerateRequest,
    GenerateResponse,
    RegenerateRequest,
    RegenerateResponse,
    TrackData,
    SongMetadata,
    AttemptLog,
    AgentStepRequest,
    AgentStepResponse,
    ToolCall,
    PitchDetectionResponse,
    RhythmInterpretationRequest,
    RhythmInterpretationResponse,
)
from app.services.composition_agent import (
    generate_midi_code as generate_midi_code_composition,
    generate_single_track_code as generate_single_track_code_composition,
    stream_composition_process,
)
from app.services.llm import (
    generate_midi_code as generate_midi_code_llm,
    generate_single_track_code as generate_single_track_code_llm,
)
from app.services.midi_executor import (
    execute_midi_generation,
    midi_to_base64,
    MIDIExecutionError,
)
from app.services.generator import generate_song_deep, GenerationError
from app.services.hybrid_agent import (
    start_agent_step,
    resume_agent_step,
    stream_agent_step,
    stream_agent_resume,
)
from app.services.pitch_detection import detect_pitch
from app.services.rhythm_interpreter import interpret_rhythm

router = APIRouter()

# Default channel/program mappings for common instruments
# The LLM will set program numbers in the MIDI files, but we use these
# as fallbacks and for channel assignment
DEFAULT_TRACK_CONFIG = {
    "drums": {"channel": 9, "program": 0},
    "bass": {"channel": 0, "program": 33},
    "guitar": {"channel": 1, "program": 25},
    "keys": {"channel": 2, "program": 4},
    "piano": {"channel": 2, "program": 0},
    "melody": {"channel": 3, "program": 73},
    "synth": {"channel": 4, "program": 81},
    "strings": {"channel": 5, "program": 48},
    "pad": {"channel": 6, "program": 89},
    "lead": {"channel": 3, "program": 80},
    "arp": {"channel": 7, "program": 84},
    "organ": {"channel": 2, "program": 16},
    "brass": {"channel": 5, "program": 61},
    "flute": {"channel": 3, "program": 73},
    "sax": {"channel": 4, "program": 66},
}


def get_track_config(track_name: str, index: int) -> dict:
    """Get channel/program for a track, with fallback for unknown instruments."""
    name_lower = track_name.lower()

    # Check for exact or partial matches
    for key, config in DEFAULT_TRACK_CONFIG.items():
        if key in name_lower:
            return config

    # Fallback: assign channel based on index (avoid channel 9 for non-drums)
    channel = index if index < 9 else index + 1
    return {"channel": min(channel, 15), "program": 0}

MAX_RETRIES = 2
MAX_TRACKS = 8


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
    agent_type = request.agent_type or "composition_agent"
    last_error = None

    # Select the appropriate generation function based on agent_type
    if agent_type == "llm":
        generate_func = generate_midi_code_llm
    else:
        generate_func = generate_midi_code_composition

    # Retry loop for transient generation errors
    for attempt in range(MAX_RETRIES):
        try:
            # Generate code from Claude
            code = await generate_func(
                prompt=params["style"], tempo=params["tempo"], key=params["key"]
            )

            # Execute the code
            midi_files = execute_midi_generation(
                code=code, tempo=params["tempo"], key=params["key"]
            )

            # Validate track count
            if len(midi_files) > MAX_TRACKS:
                # Take only the first MAX_TRACKS files
                midi_files = dict(list(midi_files.items())[:MAX_TRACKS])

            if len(midi_files) == 0:
                raise HTTPException(status_code=422, detail="No tracks were generated")

            # Convert to response format
            tracks = []
            for index, (name, midi_bytes) in enumerate(midi_files.items()):
                config = get_track_config(name, index)
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


async def stream_llm_process(prompt: str, tempo: int, key: str):
    """Generate code silently without streaming - LLM Direct mode doesn't stream."""
    code = await generate_midi_code_llm(prompt=prompt, tempo=tempo, key=key)
    # Send code_ready signal directly without streaming the code
    yield json.dumps({
        "type": "code_ready",
        "code": code
    }) + "\n"


@router.post("/generate/stream")
async def generate_song_stream(request: GenerateRequest):
    """Stream the composition process with real-time updates."""
    params = parse_prompt(request.prompt)
    agent_type = request.agent_type or "composition_agent"
    
    async def generate():
        try:
            code = None
            # Select streaming function based on agent_type
            if agent_type == "llm":
                stream_func = stream_llm_process
            else:
                stream_func = stream_composition_process
            
            async for chunk in stream_func(
                prompt=params["style"],
                tempo=params["tempo"],
                key=params["key"]
            ):
                # Parse the chunk
                try:
                    data = json.loads(chunk.strip())
                    if data.get("type") == "code_ready":
                        code = data.get("code")
                        # Send final message
                        yield f"data: {json.dumps({'type': 'code_ready'})}\n\n"
                    else:
                        # Stream message content
                        yield f"data: {chunk}"
                except json.JSONDecodeError:
                    # If it's not JSON, send as-is
                    yield f"data: {chunk}"
            
            # After streaming, execute the code if we have it
            if code:
                try:
                    midi_files = execute_midi_generation(
                        code=code,
                        tempo=params["tempo"],
                        key=params["key"]
                    )
                    
                    # Validate track count
                    if len(midi_files) > MAX_TRACKS:
                        midi_files = dict(list(midi_files.items())[:MAX_TRACKS])
                    
                    if len(midi_files) == 0:
                        yield f"data: {json.dumps({'type': 'error', 'message': 'No tracks were generated'})}\n\n"
                        return
                    
                    # Convert to response format
                    tracks = []
                    for index, (name, midi_bytes) in enumerate(midi_files.items()):
                        config = get_track_config(name, index)
                        tracks.append({
                            "name": name,
                            "midi_data": midi_to_base64(midi_bytes),
                            "channel": config["channel"],
                            "program_number": config["program"],
                        })
                    
                    # Send final result
                    result_data = {
                        'type': 'complete',
                        'tracks': tracks,
                        'metadata': {
                            'tempo': params['tempo'],
                            'key': params['key'],
                            'time_signature': '4/4'
                        },
                        'message': f'Generated {len(tracks)} track(s)'
                    }
                    yield f"data: {json.dumps(result_data)}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No code was generated'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/regenerate", response_model=RegenerateResponse)
async def regenerate_track(request: RegenerateRequest):
    """Regenerate a single track based on instruction."""

    context = request.context
    last_error = None

    # For regenerate, default to composition_agent
    # Could add agent_type to RegenerateRequest if needed in the future
    generate_func = generate_single_track_code_composition

    for attempt in range(MAX_RETRIES):
        try:
            # Generate code for single track
            code = await generate_func(
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
            config = get_track_config(track_name, 0)

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


# ============================================================================
# Deep Agent Architecture Endpoints
# ============================================================================


class DeepGenerateResponse(BaseModel):
    """Response from deep generation endpoint."""

    tracks: list[TrackData]
    metadata: SongMetadata
    message: str
    attempt_logs: list[AttemptLog]
    spec_used: Optional[dict] = None  # The SongSpec used (for debugging)


@router.post("/generate/deep", response_model=DeepGenerateResponse)
async def generate_song_deep_endpoint(request: GenerateRequest):
    """
    Generate a multi-track song using the deep agent architecture.

    This endpoint uses:
    1. Planning stage to create a structured song specification
    2. Spec-driven code generation
    3. MIDI quality validation
    4. Iterative refinement (up to 5 attempts)

    Returns detailed attempt logs for transparency.
    """
    params = parse_prompt(request.prompt)

    try:
        result = await generate_song_deep(
            prompt=params["style"],
            tempo=params["tempo"],
            key=params["key"],
        )

        # Convert MIDI files to response format
        midi_files = result["midi_files"]
        spec = result["spec"]
        attempt_logs = result["attempt_logs"]

        tracks = []
        for index, (name, midi_bytes) in enumerate(midi_files.items()):
            config = get_track_config(name, index)
            tracks.append(
                TrackData(
                    name=name,
                    midi_data=midi_to_base64(midi_bytes),
                    channel=config["channel"],
                    program_number=config["program"],
                )
            )

        return DeepGenerateResponse(
            tracks=tracks,
            metadata=SongMetadata(
                tempo=spec.tempo, key=spec.key, time_signature=spec.time_signature
            ),
            message=f"Generated {len(tracks)} track(s) after {len(attempt_logs)} attempt(s)",
            attempt_logs=attempt_logs,
            spec_used=spec.model_dump(),
        )

    except GenerationError as e:
        # Return detailed failure information
        raise HTTPException(
            status_code=422,
            detail={
                "error": str(e),
                "attempt_logs": [log.model_dump() for log in e.attempt_logs],
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/generate/stream")
async def generate_song_stream(request: GenerateRequest, req: Request):
    """
    Generate a song with real-time progress updates via SSE.

    Returns Server-Sent Events with the following event types:
    - progress: Stage updates (planning, generating, validating, refining)
    - complete: Final result with tracks
    - error: Generation failed
    """
    params = parse_prompt(request.prompt)

    async def event_generator():
        progress_queue: asyncio.Queue = asyncio.Queue()

        async def progress_callback(stage: str, data: dict):
            await progress_queue.put({"stage": stage, **data})

        # Start generation in background
        async def run_generation():
            try:
                result = await generate_song_deep(
                    prompt=params["style"],
                    tempo=params["tempo"],
                    key=params["key"],
                    progress_callback=progress_callback,
                )

                # Convert MIDI files to response format
                midi_files = result["midi_files"]
                spec = result["spec"]
                attempt_logs = result["attempt_logs"]

                tracks = []
                for index, (name, midi_bytes) in enumerate(midi_files.items()):
                    config = get_track_config(name, index)
                    tracks.append({
                        "name": name,
                        "midi_data": midi_to_base64(midi_bytes),
                        "channel": config["channel"],
                        "program_number": config["program"],
                    })

                await progress_queue.put(
                    {
                        "stage": "complete",
                        "result": {
                            "tracks": tracks,
                            "metadata": {
                                "tempo": spec.tempo,
                                "key": spec.key,
                                "time_signature": spec.time_signature,
                            },
                            "message": f"Generated {len(tracks)} track(s)",
                        },
                        "attempt_logs": [log.model_dump() for log in attempt_logs],
                    }
                )
            except GenerationError as e:
                await progress_queue.put(
                    {
                        "stage": "error",
                        "error": str(e),
                        "attempt_logs": [log.model_dump() for log in e.attempt_logs],
                    }
                )
            except Exception as e:
                await progress_queue.put(
                    {
                        "stage": "error",
                        "error": str(e),
                    }
                )
            finally:
                await progress_queue.put(None)  # Signal end

        # Start background task
        task = asyncio.create_task(run_generation())

        try:
            while True:
                # Check if client disconnected
                if await req.is_disconnected():
                    task.cancel()
                    break

                try:
                    event = await asyncio.wait_for(progress_queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield ": keepalive\n\n"
                    continue

                if event is None:
                    break

                yield f"data: {json.dumps(event)}\n\n"

        except asyncio.CancelledError:
            task.cancel()
            raise

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============================================================================
# Hybrid Agent Endpoint (frontend tool execution)
# ============================================================================


@router.post("/agent/step", response_model=AgentStepResponse)
async def agent_step(request: AgentStepRequest):
    """
    Execute a single step of the hybrid agent.

    This endpoint supports two modes:
    1. Start new conversation: Send { prompt: "..." }
    2. Resume after tool execution: Send { thread_id: "...", tool_results: [...] }

    When the agent needs to execute tools, it returns:
    - done: false
    - tool_calls: Array of tools to execute on frontend

    When the agent completes:
    - done: true
    - message: Final response from agent
    """
    try:
        if request.tool_results and request.thread_id:
            # Resume mode: continue after frontend tool execution
            result = await resume_agent_step(
                thread_id=request.thread_id,
                tool_results=[{"id": tr.id, "result": tr.result} for tr in request.tool_results],
            )
        elif request.prompt:
            # Start mode: new conversation
            result = await start_agent_step(
                prompt=request.prompt,
                thread_id=request.thread_id,
                context=request.context,
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Must provide either 'prompt' (to start) or 'tool_results' (to resume)",
            )

        return AgentStepResponse(
            thread_id=result["thread_id"],
            tool_calls=[ToolCall(**tc) for tc in result["tool_calls"]],
            done=result["done"],
            message=result["message"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent step failed: {str(e)}")


@router.post("/agent/step/stream")
async def agent_step_stream(request: AgentStepRequest, req: Request):
    """
    Execute a hybrid agent step with real-time SSE streaming.

    This endpoint supports two modes:
    1. Start new conversation: Send { prompt: "..." }
    2. Resume after tool execution: Send { thread_id: "...", tool_results: [...] }

    Returns Server-Sent Events with the following event types:
    - thinking: Agent reasoning/processing (streamed tokens)
    - tool_calls: Tools to execute on frontend (pauses stream, wait for resume)
    - tool_results_received: Acknowledgment after frontend sends tool results
    - message: Final response from agent
    - error: Any errors that occurred
    """

    async def event_generator():
        try:
            if request.tool_results and request.thread_id:
                # Resume mode: continue after frontend tool execution
                async for event in stream_agent_resume(
                    thread_id=request.thread_id,
                    tool_results=[{"id": tr.id, "result": tr.result} for tr in request.tool_results],
                ):
                    yield f"data: {json.dumps(event)}\n\n"
            elif request.prompt:
                # Start mode: new conversation
                async for event in stream_agent_step(
                    prompt=request.prompt,
                    thread_id=request.thread_id,
                    context=request.context,
                ):
                    yield f"data: {json.dumps(event)}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'error': 'Must provide either prompt (to start) or tool_results (to resume)'})}\n\n"

        except asyncio.CancelledError:
            # Client disconnected
            raise
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============================================================================
# Voice-to-MIDI Endpoints
# ============================================================================


@router.post("/detect-pitch", response_model=PitchDetectionResponse)
async def detect_pitch_endpoint(
    file: UploadFile = File(...),
    model_capacity: str = "small",
):
    """
    Detect pitch from uploaded audio file using CREPE.

    Args:
        file: Audio file (WAV, WebM, MP3, etc.)
        model_capacity: CREPE model size - 'tiny', 'small', 'medium', 'large', 'full'
                       Smaller = faster, larger = more accurate

    Returns:
        PitchDetectionResponse with grouped pitch segments
    """
    try:
        audio_bytes = await file.read()

        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")

        result = await detect_pitch(
            audio_bytes,
            model_capacity=model_capacity,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pitch detection failed: {str(e)}")


@router.post("/interpret-rhythm", response_model=RhythmInterpretationResponse)
async def interpret_rhythm_endpoint(
    request: RhythmInterpretationRequest,
):
    """
    Interpret rhythm from pitch segments using LLM.

    Args:
        request: RhythmInterpretationRequest with segments and quantize settings

    Returns:
        RhythmInterpretationResponse with quantized notes and detected tempo
    """
    try:
        if not request.segments:
            raise HTTPException(status_code=400, detail="No pitch segments provided")

        result = await interpret_rhythm(request)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rhythm interpretation failed: {str(e)}")
