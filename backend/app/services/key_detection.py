"""
Key detection and pitch quantization service for voice-to-MIDI.
"""
import numpy as np
from typing import Optional
from app.models.schemas import PitchSegment


# Major and minor scale templates (1 = in scale, 0 = not in scale)
# Index 0 = C, 1 = C#, 2 = D, etc.
MAJOR_TEMPLATE = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]  # W-W-H-W-W-W-H
MINOR_TEMPLATE = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0]  # W-H-W-W-H-W-W (natural minor)

# Pitch class names for debugging/logging
PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def _rotate_template(template: list[int], steps: int) -> list[int]:
    """Rotate a scale template by N steps (to transpose to different keys)."""
    return template[-steps:] + template[:-steps]


def _calculate_pitch_histogram(segments: list[PitchSegment]) -> np.ndarray:
    """
    Calculate a weighted histogram of pitch classes from segments.
    Weights by segment duration for more accurate representation.
    """
    histogram = np.zeros(12)

    for seg in segments:
        pitch_class = seg.midi_note % 12
        duration = seg.end_time - seg.start_time
        # Weight by duration and confidence
        weight = duration * seg.avg_confidence
        histogram[pitch_class] += weight

    # Normalize
    total = histogram.sum()
    if total > 0:
        histogram = histogram / total

    return histogram


def _match_key(histogram: np.ndarray, template: list[int]) -> tuple[int, float]:
    """
    Find the best key match for a histogram against a scale template.
    Returns (key, score) where key is 0-11 (C=0) and score is correlation.
    """
    best_key = 0
    best_score = -1.0

    for key in range(12):
        rotated = _rotate_template(template, key)
        # Correlation between histogram and template
        score = np.dot(histogram, rotated)
        if score > best_score:
            best_score = score
            best_key = key

    return best_key, best_score


def detect_key(
    segments: list[PitchSegment],
    confidence_threshold: float = 0.5,
) -> tuple[int, str, float, bool]:
    """
    Detect the musical key from pitch segments.

    Args:
        segments: List of pitch segments from CREPE detection
        confidence_threshold: Minimum confidence to consider detection reliable

    Returns:
        Tuple of (key, scale, confidence, is_confident) where:
        - key: 0-11 (C=0, C#=1, ..., B=11)
        - scale: "major" or "minor"
        - confidence: 0.0-1.0 score
        - is_confident: True if confidence >= threshold
    """
    if not segments:
        return 0, "major", 0.0, False

    histogram = _calculate_pitch_histogram(segments)

    # Try both major and minor
    major_key, major_score = _match_key(histogram, MAJOR_TEMPLATE)
    minor_key, minor_score = _match_key(histogram, MINOR_TEMPLATE)

    # Choose the better fit
    if major_score >= minor_score:
        key, scale, score = major_key, "major", major_score
    else:
        key, scale, score = minor_key, "minor", minor_score

    # Normalize confidence to 0-1 range
    # Max possible score is ~0.58 for perfect match (7 notes / 12 positions)
    confidence = min(1.0, score / 0.58)
    is_confident = confidence >= confidence_threshold

    return key, scale, confidence, is_confident


def calculate_pitch_offset(
    segments: list[PitchSegment],
    detected_key: int,
) -> float:
    """
    Calculate the median pitch offset in cents.

    This detects if the singer is consistently flat or sharp.

    Args:
        segments: List of pitch segments
        detected_key: The detected key (0-11)

    Returns:
        Offset in cents (negative = flat, positive = sharp)
    """
    if not segments:
        return 0.0

    offsets = []
    for seg in segments:
        # Expected frequency for the rounded MIDI note
        expected_freq = 440.0 * (2 ** ((seg.midi_note - 69) / 12))
        # Actual frequency
        actual_freq = seg.avg_frequency

        if expected_freq > 0 and actual_freq > 0:
            # Cents difference
            cents = 1200 * np.log2(actual_freq / expected_freq)
            offsets.append(cents)

    if not offsets:
        return 0.0

    return float(np.median(offsets))


def get_scale_notes(key: int, scale: str) -> set[int]:
    """
    Get the set of pitch classes (0-11) that belong to a key/scale.

    Args:
        key: Root note (0=C, 1=C#, etc.)
        scale: "major" or "minor"

    Returns:
        Set of pitch classes in the scale
    """
    template = MAJOR_TEMPLATE if scale == "major" else MINOR_TEMPLATE
    rotated = _rotate_template(template, key)
    return {i for i, v in enumerate(rotated) if v == 1}


def quantize_note_to_key(
    midi_note: int,
    key: int,
    scale: str,
    pitch_offset_cents: float = 0.0,
) -> int:
    """
    Quantize a MIDI note to the nearest note in the given key/scale.

    Args:
        midi_note: Original MIDI note number
        key: Key root (0-11)
        scale: "major" or "minor"
        pitch_offset_cents: Overall pitch offset to correct for

    Returns:
        Quantized MIDI note number
    """
    # First, apply offset correction
    # If singer is 30 cents flat, we add 30 cents worth of adjustment
    offset_semitones = pitch_offset_cents / 100.0
    corrected_note = midi_note + offset_semitones

    # Round to nearest semitone
    rounded_note = int(round(corrected_note))

    # Get scale notes
    scale_notes = get_scale_notes(key, scale)

    # Check if already in scale
    pitch_class = rounded_note % 12
    if pitch_class in scale_notes:
        return rounded_note

    # Find nearest scale note
    # Check one semitone up and down
    for offset in [1, -1, 2, -2]:
        candidate = rounded_note + offset
        if candidate % 12 in scale_notes:
            return candidate

    # Fallback (shouldn't happen with major/minor scales)
    return rounded_note


def quantize_segments_to_key(
    segments: list[PitchSegment],
    key: int,
    scale: str,
    pitch_offset_cents: float = 0.0,
) -> list[int]:
    """
    Quantize all segments to a key/scale.

    Args:
        segments: List of pitch segments
        key: Key root (0-11)
        scale: "major" or "minor"
        pitch_offset_cents: Overall pitch offset

    Returns:
        List of quantized MIDI note numbers (same order as segments)
    """
    return [
        quantize_note_to_key(seg.midi_note, key, scale, pitch_offset_cents)
        for seg in segments
    ]
