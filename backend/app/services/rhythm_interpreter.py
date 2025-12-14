"""
LLM-based rhythm interpretation service.
"""
import json

from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.models.schemas import (
    PitchSegment,
    InterpretedNote,
    RhythmInterpretationRequest,
    RhythmInterpretationResponse,
)
from app.services.key_detection import (
    detect_key,
    calculate_pitch_offset,
    quantize_note_to_key,
    PITCH_CLASS_NAMES,
)


settings = get_settings()

model = ChatOpenAI(
    model=settings.openrouter_model,
    openai_api_key=settings.openrouter_api_key,
    openai_api_base="https://openrouter.ai/api/v1",
    temperature=0.3,  # Lower temperature for more consistent rhythm interpretation
    max_tokens=4096,
    default_headers={
        "HTTP-Referer": "https://github.com/signal-music-composer",
        "X-Title": "AI Music Composer - Rhythm Interpreter",
    },
)


RHYTHM_SYSTEM_PROMPT = """You are a musical rhythm interpreter. Given pitch segments detected from a hummed/sung melody, your task is to convert them into properly quantized MIDI notes.

## Input Format
You'll receive:
1. Pitch segments with start_time, end_time (seconds), avg_frequency (Hz), avg_confidence (0-1), and midi_note
2. The user's quantize setting (e.g., 8 = eighth note, 4 = quarter note)
3. The project's timebase (ticks per quarter note, usually 480)
4. The project's current tempo as a fallback

## Your Task
1. **Detect Tempo**: Analyze the timing between notes. The quantize value tells you the expected minimum note length. Calculate what BPM would make the segments align to the quantize grid.
   - If quantize=8 (eighth note), the shortest notes should be eighth notes
   - Work backwards: if shortest segment is ~0.25s and should be an eighth note, then quarter=0.5s, so BPM=120
   - Round to a sensible tempo (60, 70, 80, 90, 100, 110, 120, 130, 140, 150, etc.)
   - If unclear, use the project_tempo as fallback

2. **Quantize Notes**: Convert each segment to a note with:
   - note_number: Use the midi_note from the segment
   - tick: Start position quantized to the grid (0, 240, 480, etc. for eighth notes at 480 timebase)
   - duration: Snap to note values (eighth=240, quarter=480, half=960, whole=1920 at 480 timebase)
   - velocity: 100 (default) or scale based on confidence

3. **Handle Gaps**: Short gaps between segments may be rests or breath pauses. Don't create notes for silence.

## Output Format
Return a JSON object with:
- notes: Array of {note_number, tick, duration, velocity}
- detected_tempo: The BPM you determined
- tempo_confidence: "high" if clear pattern, "medium" if reasonable guess, "low" if using fallback
- time_signature: [4, 4] unless the pattern clearly suggests otherwise

## Important Rules
- The first note doesn't have to be the shortest - analyze ALL segments to find the shortest meaningful note
- Merge very short segments (< half the quantize unit) into adjacent notes
- Ensure notes don't overlap
- Start the first note at tick 0
- Use musical judgment - the goal is a playable, musical result
- CRITICAL: Never use note durations smaller than the quantize value. If quantize=8, minimum duration is an eighth note (240 ticks at 480 timebase). No sixteenth notes allowed when quantize=8.

Respond with ONLY the JSON object, no markdown formatting or explanation."""


def format_segments_for_prompt(segments: list[PitchSegment]) -> str:
    """Format pitch segments as readable text for LLM."""
    lines = ["Detected pitch segments:"]
    for i, seg in enumerate(segments):
        duration = seg.end_time - seg.start_time
        lines.append(
            f"  {i+1}. Note {seg.midi_note} ({seg.avg_frequency:.1f}Hz) "
            f"from {seg.start_time:.3f}s to {seg.end_time:.3f}s "
            f"(duration: {duration:.3f}s, confidence: {seg.avg_confidence:.2f})"
        )
    return "\n".join(lines)


def enforce_quantize_grid(
    notes: list[InterpretedNote],
    timebase: int,
    quantize_value: int,
) -> list[InterpretedNote]:
    """
    Post-process notes to enforce the quantize grid.
    Ensures no note duration is smaller than the quantize unit
    and all tick positions are aligned to the grid.
    """
    quantize_ticks = (timebase * 4) // quantize_value

    result = []
    for note in notes:
        # Snap tick to quantize grid
        snapped_tick = round(note.tick / quantize_ticks) * quantize_ticks

        # Enforce minimum duration
        if note.duration < quantize_ticks:
            snapped_duration = quantize_ticks
        else:
            # Snap duration to quantize grid
            snapped_duration = round(note.duration / quantize_ticks) * quantize_ticks
            # Ensure at least one quantize unit
            snapped_duration = max(quantize_ticks, snapped_duration)

        result.append(InterpretedNote(
            note_number=note.note_number,
            tick=snapped_tick,
            duration=snapped_duration,
            velocity=note.velocity,
        ))

    # Adjust to start at tick 0 if needed
    if result and result[0].tick != 0:
        offset = result[0].tick
        for note in result:
            note.tick -= offset

    return result


async def interpret_rhythm(
    request: RhythmInterpretationRequest,
) -> RhythmInterpretationResponse:
    """
    Use LLM to interpret rhythm from pitch segments.
    Now includes key detection and pitch quantization.

    Args:
        request: RhythmInterpretationRequest with segments and quantize settings

    Returns:
        RhythmInterpretationResponse with quantized notes and tempo
    """
    # Step 1: Determine key (from hint or detection)
    if request.key_hint is not None and request.scale_hint is not None:
        # User provided key - use it directly
        key = request.key_hint
        scale = request.scale_hint
        key_confidence = "high"
        key_source = "user_provided"
        is_confident = True
    else:
        # Detect key from pitch segments
        key, scale, confidence, is_confident = detect_key(request.segments)
        key_confidence = "high" if confidence >= 0.7 else "medium" if confidence >= 0.5 else "low"
        key_source = "detected_confident" if is_confident else "detected_low_confidence"

    # Step 2: Calculate pitch offset
    pitch_offset = calculate_pitch_offset(request.segments, key)

    # Step 3: Quantize all segment pitches to the key
    quantized_segments = []
    for seg in request.segments:
        qnote = quantize_note_to_key(seg.midi_note, key, scale, pitch_offset)
        # Create a modified segment with quantized note
        quantized_segments.append(PitchSegment(
            start_time=seg.start_time,
            end_time=seg.end_time,
            avg_frequency=seg.avg_frequency,
            avg_confidence=seg.avg_confidence,
            midi_note=qnote,  # Use quantized note
        ))

    # Build the prompt with quantized notes
    segments_text = format_segments_for_prompt(quantized_segments)

    key_name = PITCH_CLASS_NAMES[key]
    key_info = f"\nDetected key: {key_name} {scale} (confidence: {key_confidence})"
    if pitch_offset != 0:
        flat_sharp = "flat" if pitch_offset < 0 else "sharp"
        key_info += f"\nPitch offset correction: {abs(pitch_offset):.1f} cents {flat_sharp}"

    quantize_names = {
        1: "whole note",
        2: "half note",
        4: "quarter note",
        8: "eighth note",
        16: "sixteenth note",
        32: "thirty-second note",
    }
    quantize_name = quantize_names.get(request.quantize_value, f"1/{request.quantize_value} note")

    user_prompt = f"""{segments_text}
{key_info}

Settings:
- Quantize: {request.quantize_value} ({quantize_name})
- Timebase: {request.timebase} ticks per quarter note
- Project tempo (fallback): {request.project_tempo} BPM

Convert these segments to quantized MIDI notes. Remember:
- At timebase {request.timebase}: quarter={request.timebase}, eighth={request.timebase//2}, sixteenth={request.timebase//4}
- Analyze the segment durations to detect tempo
- Quantize note starts and durations to the grid
- The midi_note values are already quantized to {key_name} {scale} - use them as-is
- Return ONLY valid JSON"""

    # Call LLM
    response = await model.ainvoke([
        {"role": "system", "content": RHYTHM_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ])

    # Parse response
    try:
        # Clean up response - remove markdown if present
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)

        # Validate and convert to response model
        notes = [
            InterpretedNote(
                note_number=n["note_number"],
                tick=n["tick"],
                duration=n["duration"],
                velocity=n.get("velocity", 100),
            )
            for n in result["notes"]
        ]

        # Enforce quantize grid as a safety net
        notes = enforce_quantize_grid(notes, request.timebase, request.quantize_value)

        return RhythmInterpretationResponse(
            notes=notes,
            detected_tempo=result["detected_tempo"],
            tempo_confidence=result.get("tempo_confidence", "medium"),
            time_signature=tuple(result.get("time_signature", [4, 4])),
            detected_key=key,
            detected_scale=scale,
            key_confidence=key_confidence,
            pitch_offset_cents=pitch_offset,
            key_source=key_source,
        )

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        # Fallback: simple quantization without LLM
        print(f"LLM response parsing failed: {e}, using fallback")
        return fallback_rhythm_interpretation(request, key, scale, key_confidence, pitch_offset, key_source)


def fallback_rhythm_interpretation(
    request: RhythmInterpretationRequest,
    key: int = 0,
    scale: str = "major",
    key_confidence: str = "low",
    pitch_offset: float = 0.0,
    key_source: str = "detected_low_confidence",
) -> RhythmInterpretationResponse:
    """
    Simple fallback rhythm interpretation without LLM.
    Uses project tempo and basic quantization with key quantization.
    """
    notes = []
    timebase = request.timebase
    quantize_ticks = (timebase * 4) // request.quantize_value

    # Calculate ticks per second at project tempo
    ticks_per_second = (request.project_tempo / 60) * timebase

    for seg in request.segments:
        # Quantize pitch to key
        quantized_pitch = quantize_note_to_key(seg.midi_note, key, scale, pitch_offset)

        # Convert time to ticks
        start_tick = int(seg.start_time * ticks_per_second)
        end_tick = int(seg.end_time * ticks_per_second)

        # Quantize start
        start_tick = round(start_tick / quantize_ticks) * quantize_ticks

        # Calculate duration, minimum of one quantize unit
        duration = max(quantize_ticks, round((end_tick - start_tick) / quantize_ticks) * quantize_ticks)

        notes.append(InterpretedNote(
            note_number=quantized_pitch,  # Use quantized pitch
            tick=start_tick,
            duration=duration,
            velocity=100,
        ))

    # Adjust to start at tick 0
    if notes:
        offset = notes[0].tick
        for note in notes:
            note.tick -= offset

    return RhythmInterpretationResponse(
        notes=notes,
        detected_tempo=request.project_tempo,
        tempo_confidence="low",
        time_signature=(4, 4),
        detected_key=key,
        detected_scale=scale,
        key_confidence=key_confidence,
        pitch_offset_cents=pitch_offset,
        key_source=key_source,
    )
