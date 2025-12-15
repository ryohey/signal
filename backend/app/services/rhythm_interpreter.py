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
    PITCH_CLASS_NAMES,
)
from app.services.interval_processing import (
    process_segments_with_intervals,
    create_new_logger,
    get_logger,
    set_logger,
)
from app.services.pitch_detection import get_last_raw_crepe_data, clear_raw_crepe_data


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
    Now uses interval-based pitch processing to preserve melodic relationships.

    Args:
        request: RhythmInterpretationRequest with segments and quantize settings

    Returns:
        RhythmInterpretationResponse with quantized notes and tempo
    """
    # Create a new logger for this request
    logger = create_new_logger()
    logger.log_section("VOICE-TO-MIDI PROCESSING LOG")
    logger.log(f"Request: quantize={request.quantize_value}, tempo={request.project_tempo}, timebase={request.timebase}")

    # Get raw CREPE data if available
    raw_data = get_last_raw_crepe_data()
    log_raw = raw_data is not None

    if log_raw:
        logger.log_subsection("Amplitude Trimming Info")
        logger.log(f"  Singing detected from {raw_data['amplitude_start_time']:.3f}s to {raw_data['amplitude_end_time']:.3f}s")
        logger.log(f"  Total raw frames: {len(raw_data['raw_time'])}")
        logger.log(f"  Frames after trim: {len(raw_data['filtered_time'])}")

        # Log RMS amplitude data
        rms = raw_data.get('rms')
        if rms is not None:
            logger.log_subsection("RMS Amplitude Data (10ms frames)")
            logger.log(f"  Total RMS frames: {len(rms)}")
            logger.log(f"  Min RMS: {rms.min():.6f}, Max RMS: {rms.max():.6f}, Mean RMS: {rms.mean():.6f}")
            logger.log(f"  {'Frame':>6s}  {'Time':>8s}  {'RMS':>10s}  {'Rel Δ':>10s}")
            logger.log(f"  {'-'*6}  {'-'*8}  {'-'*10}  {'-'*10}")
            hop_size_ms = 10.0
            for i, rms_val in enumerate(rms):
                time_sec = i * hop_size_ms / 1000.0
                if i > 0 and rms[i-1] > 0:
                    rel_change = (rms_val - rms[i-1]) / rms[i-1]
                    rel_str = f"{rel_change:+.4f}"
                else:
                    rel_str = "N/A"
                logger.log(f"  {i:6d}  {time_sec:8.3f}  {rms_val:10.6f}  {rel_str:>10s}")

        # Log onset detection results
        onsets = raw_data.get('onsets', [])
        logger.log_subsection("Onset Detection")
        logger.log(f"  Parameters: threshold_ratio=1.5 (150%), min_rms=0.02, min_onset_gap=100ms")
        logger.log(f"  Detected {len(onsets)} onsets")
        if onsets:
            logger.log(f"  Onset timestamps: {', '.join(f'{t:.3f}s' for t in onsets[:20])}" +
                      (f" ... (+{len(onsets)-20} more)" if len(onsets) > 20 else ""))

    # Step 1: Process segments using interval-based approach
    # This filters short notes, absorbs transitions, merges same-pitch segments,
    # and derives MIDI notes from intervals rather than absolute frequencies
    processed_segments = process_segments_with_intervals(
        request.segments,
        min_duration_ms=75.0,
        log_raw_frames=log_raw,
        raw_time=raw_data['filtered_time'] if log_raw else None,
        raw_frequency=raw_data['filtered_frequency'] if log_raw else None,
        raw_confidence=raw_data['filtered_confidence'] if log_raw else None,
        onsets=raw_data.get('onsets') if raw_data else None,
    )

    if not processed_segments:
        # No valid segments after processing - return empty response
        logger.log_section("NO VALID SEGMENTS")
        logger.log("All segments were filtered out - returning empty response")
        log_path = logger.save("logs")
        print(f"Voice-to-MIDI log saved: {log_path}")
        clear_raw_crepe_data()

        return RhythmInterpretationResponse(
            notes=[],
            detected_tempo=request.project_tempo,
            tempo_confidence="low",
            time_signature=(4, 4),
            detected_key=0,
            detected_scale="major",
            key_confidence="low",
            pitch_offset_cents=0.0,
            key_source="none",
        )

    # Step 2: Determine key from anchor note (first note after processing)
    # The anchor note's MIDI number tells us the key
    anchor_midi = processed_segments[0].midi_note
    anchor_pitch_class = anchor_midi % 12

    # If user provided key hint, use it; otherwise use anchor note as key
    if request.key_hint is not None and request.scale_hint is not None:
        key = request.key_hint
        scale = request.scale_hint
        key_confidence = "high"
        key_source = "user_provided"
    else:
        # Use anchor pitch class as key, default to major
        key = anchor_pitch_class
        scale = "major"  # Default assumption
        key_confidence = "medium"
        key_source = "anchor_note"

    # Step 3: No pitch offset needed with interval approach
    # (intervals preserve relative pitch, so global offset is implicit)
    pitch_offset = 0.0

    # Use processed segments for rhythm interpretation
    quantized_segments = processed_segments

    # Build the prompt with processed notes
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

        # Log final rhythm interpretation results
        logger.log_section("RHYTHM INTERPRETATION RESULTS")
        logger.log(f"Detected tempo: {result['detected_tempo']} BPM")
        logger.log(f"Tempo confidence: {result.get('tempo_confidence', 'medium')}")
        logger.log(f"Time signature: {result.get('time_signature', [4, 4])}")
        logger.log(f"Key: {PITCH_CLASS_NAMES[key]} {scale} ({key_source})")
        logger.log_subsection("Final MIDI Notes")
        for i, note in enumerate(notes):
            from app.services.interval_processing import midi_to_note_name
            note_name = midi_to_note_name(note.note_number)
            logger.log(f"  {i+1}. {note_name} (MIDI {note.note_number}) tick={note.tick} dur={note.duration} vel={note.velocity}")

        # Save log file
        log_path = logger.save("logs")
        print(f"Voice-to-MIDI log saved: {log_path}")
        clear_raw_crepe_data()

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
        fallback_result = fallback_rhythm_interpretation(request, key, scale, key_confidence, pitch_offset, key_source)

        # Log fallback results
        logger.log_section("FALLBACK RHYTHM INTERPRETATION")
        logger.log(f"LLM parsing failed: {e}")
        logger.log(f"Using project tempo: {request.project_tempo} BPM")
        logger.log_subsection("Final MIDI Notes (fallback)")
        for i, note in enumerate(fallback_result.notes):
            from app.services.interval_processing import midi_to_note_name
            note_name = midi_to_note_name(note.note_number)
            logger.log(f"  {i+1}. {note_name} (MIDI {note.note_number}) tick={note.tick} dur={note.duration} vel={note.velocity}")

        # Save log file
        log_path = logger.save("logs")
        print(f"Voice-to-MIDI log saved: {log_path}")
        clear_raw_crepe_data()

        return fallback_result


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
    Uses project tempo and basic quantization with interval-based pitch processing.
    """
    # Process segments with interval approach
    processed_segments = process_segments_with_intervals(
        request.segments,
        min_duration_ms=75.0,
    )

    if not processed_segments:
        return RhythmInterpretationResponse(
            notes=[],
            detected_tempo=request.project_tempo,
            tempo_confidence="low",
            time_signature=(4, 4),
            detected_key=key,
            detected_scale=scale,
            key_confidence=key_confidence,
            pitch_offset_cents=pitch_offset,
            key_source=key_source,
        )

    notes = []
    timebase = request.timebase
    quantize_ticks = (timebase * 4) // request.quantize_value

    # Calculate ticks per second at project tempo
    ticks_per_second = (request.project_tempo / 60) * timebase

    for seg in processed_segments:
        # Convert time to ticks
        start_tick = int(seg.start_time * ticks_per_second)
        end_tick = int(seg.end_time * ticks_per_second)

        # Quantize start
        start_tick = round(start_tick / quantize_ticks) * quantize_ticks

        # Calculate duration, minimum of one quantize unit
        duration = max(quantize_ticks, round((end_tick - start_tick) / quantize_ticks) * quantize_ticks)

        notes.append(InterpretedNote(
            note_number=seg.midi_note,  # Already processed by interval approach
            tick=start_tick,
            duration=duration,
            velocity=100,
        ))

    # Adjust to start at tick 0
    if notes:
        offset = notes[0].tick
        for note in notes:
            note.tick -= offset

    # Update key from anchor if not provided
    if key_source != "user_provided" and processed_segments:
        key = processed_segments[0].midi_note % 12
        key_source = "anchor_note"

    return RhythmInterpretationResponse(
        notes=notes,
        detected_tempo=request.project_tempo,
        tempo_confidence="low",
        time_signature=(4, 4),
        detected_key=key,
        detected_scale=scale,
        key_confidence=key_confidence,
        pitch_offset_cents=0.0,  # No offset with interval approach
        key_source=key_source,
    )
