"""MIDI quality validation service."""

from typing import Dict, List
from app.models.schemas import (
    SongSpec,
    TrackMetrics,
    ValidationResult,
)
from app.services.midi_parser import parse_midi_bytes, compute_track_metrics
from app.services.llm import client
from app.config import get_settings

settings = get_settings()

# Quality thresholds - very permissive to allow varied music styles
# The goal is to catch truly broken output, not enforce a specific style
THRESHOLDS = {
    "min_eighth_note_pct": 10,  # At least 10% eighth notes or faster
    "min_velocity_range": 10,  # velocity_max - velocity_min >= 10
    "min_velocity_std": 2,  # Some velocity variation
    "min_syncopation": 0.0,  # Disabled - standard backbeat has low syncopation by this metric
    "min_notes_per_bar": 0.5,  # At least some notes
    "max_silence_pct": 95,  # Allow very sparse arrangements
    # Drum-specific thresholds (to prevent half-time feel)
    "min_snare_hits_per_bar": 1.5,  # Standard backbeat has 2, allow some fills/breaks
    "min_hihat_hits_per_bar": 6.0,  # Eighth notes = 8/bar, allow some variation
    "min_kick_hits_per_bar": 1.5,   # At least on beats 1 and 3
}


def validate_track_metrics(metrics: TrackMetrics, is_drums: bool = False) -> List[str]:
    """Check a single track's metrics against thresholds."""
    issues = []

    if metrics.note_count == 0:
        issues.append(f"{metrics.name}: no notes generated")
        return issues

    if metrics.eighth_note_or_faster_pct < THRESHOLDS["min_eighth_note_pct"]:
        issues.append(
            f"{metrics.name}: rhythm too simple - only {metrics.eighth_note_or_faster_pct:.0f}% "
            f"eighth notes (need {THRESHOLDS['min_eighth_note_pct']}%)"
        )

    vel_range = metrics.velocity_max - metrics.velocity_min
    if vel_range < THRESHOLDS["min_velocity_range"]:
        issues.append(
            f"{metrics.name}: velocity too flat - range {vel_range} "
            f"(need {THRESHOLDS['min_velocity_range']})"
        )

    if metrics.velocity_std < THRESHOLDS["min_velocity_std"]:
        issues.append(
            f"{metrics.name}: velocity variation too low - std {metrics.velocity_std:.1f} "
            f"(need {THRESHOLDS['min_velocity_std']})"
        )

    if not is_drums and metrics.syncopation_score < THRESHOLDS["min_syncopation"]:
        issues.append(
            f"{metrics.name}: lacks syncopation - score {metrics.syncopation_score:.2f} "
            f"(need {THRESHOLDS['min_syncopation']})"
        )

    if metrics.notes_per_bar < THRESHOLDS["min_notes_per_bar"]:
        issues.append(
            f"{metrics.name}: too sparse - {metrics.notes_per_bar:.1f} notes/bar "
            f"(need {THRESHOLDS['min_notes_per_bar']})"
        )

    if metrics.silence_pct > THRESHOLDS["max_silence_pct"]:
        issues.append(
            f"{metrics.name}: too much silence - {metrics.silence_pct:.0f}% "
            f"(max {THRESHOLDS['max_silence_pct']}%)"
        )

    return issues


def validate_drum_pattern(metrics: TrackMetrics) -> List[str]:
    """Check drum-specific pattern metrics for half-time issues."""
    issues = []

    # Only validate if drum metrics are present
    if metrics.snare_hits_per_bar is None:
        return issues

    if metrics.snare_hits_per_bar < THRESHOLDS["min_snare_hits_per_bar"]:
        issues.append(
            f"{metrics.name}: HALF-TIME DETECTED - only {metrics.snare_hits_per_bar:.1f} snare hits/bar "
            f"(need {THRESHOLDS['min_snare_hits_per_bar']} for standard backbeat)"
        )

    if metrics.hihat_hits_per_bar is not None and metrics.hihat_hits_per_bar < THRESHOLDS["min_hihat_hits_per_bar"]:
        issues.append(
            f"{metrics.name}: hi-hat too sparse - {metrics.hihat_hits_per_bar:.1f} hits/bar "
            f"(need {THRESHOLDS['min_hihat_hits_per_bar']} for eighth notes)"
        )

    if metrics.kick_hits_per_bar is not None and metrics.kick_hits_per_bar < THRESHOLDS["min_kick_hits_per_bar"]:
        issues.append(
            f"{metrics.name}: kick too sparse - {metrics.kick_hits_per_bar:.1f} hits/bar "
            f"(need {THRESHOLDS['min_kick_hits_per_bar']})"
        )

    return issues


async def llm_light_review(
    spec: SongSpec, track_metrics: List[TrackMetrics], prompt: str
) -> str:
    """Light LLM review of generation quality based on summary stats."""

    # Build summary for LLM
    metrics_summary = []
    for m in track_metrics:
        metrics_summary.append(
            f"- {m.name}: {m.note_count} notes, {m.notes_per_bar:.1f}/bar, "
            f"vel {m.velocity_min}-{m.velocity_max} (std {m.velocity_std:.1f}), "
            f"{m.eighth_note_or_faster_pct:.0f}% eighth+, syncopation {m.syncopation_score:.2f}"
        )

    review_prompt = f"""Review this AI-generated music for quality. Be brief (2-3 sentences).

Original request: "{prompt}"
Style: {spec.style}
Tempo: {spec.tempo} BPM, Key: {spec.key}

Track metrics:
{chr(10).join(metrics_summary)}

Does this output seem reasonable for the requested style? Any obvious issues?"""

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=200,
        messages=[
            {
                "role": "system",
                "content": "You are a music quality reviewer. Be concise and specific.",
            },
            {"role": "user", "content": review_prompt},
        ],
        extra_headers={
            "HTTP-Referer": "https://github.com/signal-music-composer",
            "X-Title": "AI Music Composer",
        },
    )

    return response.choices[0].message.content


async def validate_midi_output(
    midi_files: Dict[str, bytes],
    spec: SongSpec,
    prompt: str,
    skip_llm_review: bool = False,
) -> ValidationResult:
    """
    Validate generated MIDI files against quality thresholds.

    Args:
        midi_files: Dict of track_name -> MIDI bytes
        spec: The SongSpec used for generation
        prompt: Original user prompt
        skip_llm_review: Skip the LLM review step (for faster iteration)

    Returns:
        ValidationResult with pass/fail, metrics, and suggestions
    """
    all_metrics = []
    all_issues = []

    for track_name, midi_bytes in midi_files.items():
        try:
            ticks_per_beat, tempo, notes = parse_midi_bytes(midi_bytes)
            metrics_dict = compute_track_metrics(
                notes, ticks_per_beat, tempo, track_name
            )
            metrics = TrackMetrics(**metrics_dict)
            all_metrics.append(metrics)

            is_drums = "drum" in track_name.lower() or metrics_dict.get("channel") == 9
            issues = validate_track_metrics(metrics, is_drums=is_drums)
            all_issues.extend(issues)

            # Additional drum pattern validation
            if is_drums:
                drum_issues = validate_drum_pattern(metrics)
                all_issues.extend(drum_issues)

        except Exception as e:
            all_issues.append(f"{track_name}: failed to parse MIDI - {str(e)}")

    # Calculate overall score
    if not all_metrics:
        overall_score = 0.0
    else:
        # Score based on how many tracks pass all checks
        tracks_with_issues = len(set(i.split(":")[0] for i in all_issues))
        overall_score = 1.0 - (tracks_with_issues / len(all_metrics))

    # LLM review (if not skipped and we have metrics)
    llm_review = None
    if not skip_llm_review and all_metrics:
        try:
            llm_review = await llm_light_review(spec, all_metrics, prompt)
        except Exception as e:
            llm_review = f"LLM review failed: {str(e)}"

    # Generate suggestions based on issues
    suggestions = []
    if any("rhythm too simple" in i for i in all_issues):
        suggestions.append("Increase use of eighth and sixteenth notes")
    if any("velocity" in i for i in all_issues):
        suggestions.append("Add more velocity dynamics - vary between 40-100")
    if any("syncopation" in i for i in all_issues):
        suggestions.append("Add more off-beat notes for groove")
    if any("sparse" in i for i in all_issues):
        suggestions.append("Increase note density")
    if any("HALF-TIME" in i for i in all_issues):
        suggestions.append(
            "Drum pattern is half-time. Snare must hit on BOTH beats 2 and 4 (times 1.0 and 3.0) in each bar. "
            "Hi-hat should play eighth notes (8 per bar). This is standard for rock/pop music."
        )
    if any("hi-hat too sparse" in i for i in all_issues):
        suggestions.append("Hi-hat should play eighth notes throughout - 8 hits per bar minimum")

    passed = len(all_issues) == 0 and overall_score >= 0.8

    return ValidationResult(
        passed=passed,
        overall_score=overall_score,
        track_metrics=all_metrics,
        issues=all_issues,
        llm_review=llm_review,
        suggestions=suggestions,
    )
