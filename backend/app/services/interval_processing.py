"""
Interval-based pitch processing for voice-to-MIDI.

This module implements an interval-based approach to pitch processing that:
1. Filters out short segments (slurs/transitions)
2. Merges same-pitch segments
3. Extracts melodic intervals between consecutive notes
4. Rounds intervals to nearest semitone (12th root of 2)
5. Anchors the melody based on the first note's frequency

This preserves melodic relationships even when singers are consistently off-key.
"""
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Optional
from app.models.schemas import PitchSegment


# MIDI note names for logging
MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def midi_to_note_name(midi_note: int) -> str:
    """Convert MIDI note number to note name (e.g., 69 -> 'A4')."""
    if midi_note <= 0:
        return "N/A"
    octave = (midi_note // 12) - 1
    note = MIDI_NOTE_NAMES[midi_note % 12]
    return f"{note}{octave}"


def calculate_frequency_slope(freq_start: float, freq_end: float, duration_sec: float) -> float:
    """
    Calculate the frequency slope (Hz per second) for a segment.

    Positive slope = pitch rising, negative = pitch falling, near-zero = stable.

    Args:
        freq_start: Frequency at segment start (Hz)
        freq_end: Frequency at segment end (Hz)
        duration_sec: Segment duration in seconds

    Returns:
        Slope in Hz/second
    """
    if duration_sec <= 0:
        return 0.0
    return (freq_end - freq_start) / duration_sec


class IntervalProcessingLogger:
    """Logger for interval processing debug output."""

    def __init__(self):
        self.lines: list[str] = []
        self.enabled = True

    def log(self, message: str):
        """Add a line to the log."""
        if self.enabled:
            self.lines.append(message)

    def log_section(self, title: str):
        """Add a section header."""
        self.log("")
        self.log("=" * 60)
        self.log(title)
        self.log("=" * 60)

    def log_subsection(self, title: str):
        """Add a subsection header."""
        self.log("")
        self.log("-" * 40)
        self.log(title)
        self.log("-" * 40)

    def get_log(self) -> str:
        """Get the full log as a string."""
        return "\n".join(self.lines)

    def save(self, output_dir: str = "logs") -> str:
        """Save log to a file and return the path."""
        path = Path(output_dir)
        path.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"voice_to_midi_{timestamp}.txt"
        filepath = path / filename

        filepath.write_text(self.get_log())
        return str(filepath)


# Global logger instance (will be set per request)
_current_logger: Optional[IntervalProcessingLogger] = None


def get_logger() -> IntervalProcessingLogger:
    """Get the current logger, creating one if needed."""
    global _current_logger
    if _current_logger is None:
        _current_logger = IntervalProcessingLogger()
    return _current_logger


def set_logger(logger: Optional[IntervalProcessingLogger]):
    """Set the current logger."""
    global _current_logger
    _current_logger = logger


def create_new_logger() -> IntervalProcessingLogger:
    """Create and set a new logger for a new request."""
    logger = IntervalProcessingLogger()
    set_logger(logger)
    return logger


# Standard reference frequencies (A4 = 440 Hz)
MIDI_FREQUENCIES = {
    60: 261.63,  # C4
    61: 277.18,  # C#4
    62: 293.66,  # D4
    63: 311.13,  # D#4
    64: 329.63,  # E4
    65: 349.23,  # F4
    66: 369.99,  # F#4
    67: 392.00,  # G4
    68: 415.30,  # G#4
    69: 440.00,  # A4
    70: 466.16,  # A#4
    71: 493.88,  # B4
    72: 523.25,  # C5
}

# 12th roots of 2 for interval detection
SEMITONE_RATIOS = [2 ** (i / 12) for i in range(25)]  # 0 to 24 semitones (2 octaves)

# Scale patterns (semitones from root)
# Major scale: W W H W W W H (0, 2, 4, 5, 7, 9, 11)
# Minor scale: W H W W H W W (0, 2, 3, 5, 7, 8, 10)
SCALE_PATTERNS = {
    'major': {0, 2, 4, 5, 7, 9, 11},
    'minor': {0, 2, 3, 5, 7, 8, 10},
    'chromatic': {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11},  # All notes
}

# Global key context (will be set per request)
_current_key: Optional[tuple[int, str]] = None  # (root_midi_pitch_class, scale_type)


def set_key(root_note: str, scale_type: str = 'major'):
    """
    Set the musical key for interval snapping.

    Args:
        root_note: Root note name (e.g., 'C#', 'G', 'Bb')
        scale_type: 'major', 'minor', or 'chromatic'
    """
    global _current_key

    # Parse root note to pitch class (0-11)
    note_to_pc = {
        'C': 0, 'C#': 1, 'Db': 1,
        'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'Fb': 4, 'E#': 5,
        'F': 5, 'F#': 6, 'Gb': 6,
        'G': 7, 'G#': 8, 'Ab': 8,
        'A': 9, 'A#': 10, 'Bb': 10,
        'B': 11, 'Cb': 11, 'B#': 0,
    }

    root_pc = note_to_pc.get(root_note)
    if root_pc is None:
        raise ValueError(f"Unknown root note: {root_note}")

    if scale_type not in SCALE_PATTERNS:
        raise ValueError(f"Unknown scale type: {scale_type}. Use 'major', 'minor', or 'chromatic'")

    _current_key = (root_pc, scale_type)

    logger = get_logger()
    logger.log(f"  Key set to: {root_note} {scale_type}")


def get_key() -> Optional[tuple[int, str]]:
    """Get the current key context."""
    return _current_key


def clear_key():
    """Clear the key context (revert to chromatic/no key awareness)."""
    global _current_key
    _current_key = None


def is_note_in_key(midi_note: int, key: Optional[tuple[int, str]] = None) -> bool:
    """
    Check if a MIDI note is in the current key.

    Args:
        midi_note: MIDI note number
        key: Optional key override (root_pc, scale_type). Uses global if not provided.

    Returns:
        True if note is in key, False otherwise. Always True if no key is set.
    """
    if key is None:
        key = _current_key

    if key is None:
        return True  # No key set = all notes valid

    root_pc, scale_type = key
    scale_pattern = SCALE_PATTERNS.get(scale_type, SCALE_PATTERNS['chromatic'])

    # Get pitch class of the note (0-11)
    note_pc = midi_note % 12

    # Calculate interval from root
    interval_from_root = (note_pc - root_pc) % 12

    return interval_from_root in scale_pattern


def get_scale_notes_in_key(key: Optional[tuple[int, str]] = None) -> set[int]:
    """
    Get all pitch classes (0-11) that are in the current key.

    Returns:
        Set of pitch classes in the key
    """
    if key is None:
        key = _current_key

    if key is None:
        return set(range(12))  # All notes

    root_pc, scale_type = key
    scale_pattern = SCALE_PATTERNS.get(scale_type, SCALE_PATTERNS['chromatic'])

    return {(root_pc + interval) % 12 for interval in scale_pattern}


def frequency_to_nearest_midi(frequency: float) -> int:
    """
    Convert a frequency to the nearest MIDI note number.

    Uses A4 = 440 Hz as reference.

    Args:
        frequency: Frequency in Hz

    Returns:
        MIDI note number (0-127)
    """
    if frequency <= 0:
        return 0
    midi = 69 + 12 * np.log2(frequency / 440.0)
    return int(round(midi))


def calculate_interval_semitones(freq1: float, freq2: float, source_midi: Optional[int] = None) -> int:
    """
    Calculate the interval in semitones between two frequencies using key-aware snapping.

    Uses intelligent rounding that prioritizes landing on in-key notes:
    1. First checks if we're in a confident zone (close to an integer)
    2. If we have key context, checks if the nearest note is in key
       - If yes, use it
       - If no, check if the other candidate is in key and within tolerance
    3. Falls back to musical interval preference for ambiguous cases

    The key insight: singers tend to sing in tune with themselves (consistent relative
    pitch) even if their absolute pitch drifts. When we know the key, we should trust
    it strongly - a singer might be a bit flat on F4 but they're not trying to sing E4
    if E isn't in the key.

    Args:
        freq1: First frequency (Hz)
        freq2: Second frequency (Hz)
        source_midi: MIDI note of the source (freq1). If provided, enables key-aware snapping.

    Returns:
        Interval in semitones (positive = up, negative = down)
    """
    if freq1 <= 0 or freq2 <= 0:
        return 0

    ratio = freq2 / freq1

    # Calculate raw semitones using logarithm
    raw_semitones = 12 * np.log2(ratio)

    # Get the two candidate intervals (floor and ceil)
    lower = int(np.floor(raw_semitones))
    upper = lower + 1

    # Calculate fractional part (how far from lower integer)
    fraction = raw_semitones - lower
    # Distance to nearest integer
    dist_to_lower = fraction
    dist_to_upper = 1 - fraction

    # Determine the "nearest" candidate by simple rounding
    nearest = lower if fraction < 0.5 else upper
    other = upper if fraction < 0.5 else lower

    # KEY-AWARE SNAPPING (only when one candidate is in key and the other isn't)
    key = get_key()
    if key is not None and source_midi is not None:
        nearest_target = source_midi + nearest
        other_target = source_midi + other

        nearest_in_key = is_note_in_key(nearest_target, key)
        other_in_key = is_note_in_key(other_target, key)

        # Key can only help when exactly ONE candidate is in key
        if nearest_in_key != other_in_key:
            # Case 1: Nearest is in key, other is not -> use nearest (confident)
            if nearest_in_key:
                return nearest

            # Case 2: Nearest is NOT in key, other IS in key
            # Be generous here! When the key clearly tells us one note is wrong
            # and the other is right, trust the key even if the singer is quite
            # flat/sharp. Singers often drift but rarely sing accidentals by accident.
            # Allow correction up to 0.85 semitones (almost a full semitone) from
            # the in-key note - this covers singers who are significantly flat/sharp.
            dist_to_other = dist_to_upper if other == upper else dist_to_lower
            if dist_to_other <= 0.85:  # Generous tolerance when key definitively helps
                return other

        # If both or neither are in key, fall through to standard logic

    # CONFIDENT ZONE: Within 0.35 of an integer, just round to it
    if fraction <= 0.35:
        return lower
    if fraction >= 0.65:
        return upper

    # AMBIGUOUS ZONE (0.35-0.65): Use musical interval preference
    interval_preference = {
        0: 10,   # Unison - very common (repeated notes)
        1: 8,    # Minor 2nd - common (chromatic movement)
        2: 9,    # Major 2nd - very common (scale steps)
        3: 6,    # Minor 3rd - less common
        4: 7,    # Major 3rd - moderately common
        5: 8,    # Perfect 4th - common
        6: 3,    # Tritone - rare
        7: 7,    # Perfect 5th - moderately common
        8: 4,    # Minor 6th - less common
        9: 5,    # Major 6th - less common
        10: 3,   # Minor 7th - less common
        11: 4,   # Major 7th - less common
        12: 8,   # Octave - common
    }

    def get_preference(interval: int) -> int:
        """Get preference score for an interval (works for negative intervals too)."""
        abs_interval = abs(interval)
        if abs_interval > 12:
            abs_interval = abs_interval % 12
        return interval_preference.get(abs_interval, 2)

    lower_pref = get_preference(lower)
    upper_pref = get_preference(upper)

    if lower_pref > upper_pref:
        return lower
    elif upper_pref > lower_pref:
        return upper
    else:
        return int(round(raw_semitones))


def filter_by_duration(
    segments: list[PitchSegment],
    min_duration_ms: float = 75.0,
) -> list[PitchSegment]:
    """
    Filter out segments shorter than the minimum duration.

    This removes slurs and transitions between notes.

    Args:
        segments: List of pitch segments
        min_duration_ms: Minimum duration in milliseconds

    Returns:
        Filtered list of segments
    """
    logger = get_logger()
    logger.log_subsection(f"Duration Filtering (min: {min_duration_ms}ms)")

    min_duration_sec = min_duration_ms / 1000.0
    result = []

    for seg in segments:
        duration_ms = (seg.end_time - seg.start_time) * 1000
        kept = duration_ms >= min_duration_ms
        status = "KEPT" if kept else "FILTERED"
        note_name = midi_to_note_name(seg.midi_note)

        logger.log(
            f"  {status}: {note_name} (MIDI {seg.midi_note}) "
            f"@ {seg.start_time:.3f}s-{seg.end_time:.3f}s "
            f"({duration_ms:.1f}ms, {seg.avg_frequency:.1f}Hz)"
        )

        if kept:
            result.append(seg)

    logger.log(f"  Result: {len(result)} segments kept, {len(segments) - len(result)} filtered")
    return result


def detect_confidence_valleys(
    raw_time: np.ndarray,
    raw_frequency: np.ndarray,
    raw_confidence: np.ndarray,
    dip_threshold: float = 0.5,
    recovery_threshold: float = 0.6,
    min_semitone_change: float = 1.5,
    min_gap_ms: float = 100.0,
) -> list[float]:
    """
    Detect note boundaries where confidence dips and recovers with a pitch change.

    This catches legato transitions where amplitude stays steady but the singer
    moves to a new pitch. The pattern is:
    1. Confidence drops below dip_threshold (voice transitioning)
    2. Confidence recovers above recovery_threshold (new pitch stabilizing)
    3. Pitch before dip differs from pitch after recovery by >= min_semitone_change

    Args:
        raw_time: CREPE time array
        raw_frequency: CREPE frequency array
        raw_confidence: CREPE confidence array
        dip_threshold: Confidence must drop below this to start a valley
        recovery_threshold: Confidence must rise above this to end a valley
        min_semitone_change: Minimum pitch change (semitones) to consider a new note
        min_gap_ms: Minimum time between detected valleys

    Returns:
        List of timestamps where new notes begin (recovery points)
    """
    logger = get_logger()
    logger.log_subsection("Confidence Valley Detection")
    logger.log(f"  Parameters: dip_thresh={dip_threshold}, recovery_thresh={recovery_threshold}, min_semitones={min_semitone_change}")

    if len(raw_time) < 5:
        logger.log("  Not enough frames for valley detection")
        return []

    valleys = []
    in_valley = False
    valley_start_idx = -1
    pre_valley_freq = 0.0
    min_gap_sec = min_gap_ms / 1000.0
    last_valley_time = -1.0

    # Look for confident frames before the dip to get pre-valley pitch
    confident_freq_buffer = []
    confident_conf_buffer = []

    for i in range(len(raw_time)):
        conf = raw_confidence[i]
        freq = raw_frequency[i]
        time = raw_time[i]

        if not in_valley:
            # Track recent confident frames
            if conf >= recovery_threshold and freq > 0:
                confident_freq_buffer.append(freq)
                confident_conf_buffer.append(conf)
                # Keep only last 10 frames (~100ms)
                if len(confident_freq_buffer) > 10:
                    confident_freq_buffer.pop(0)
                    confident_conf_buffer.pop(0)

            # Check for dip
            if conf < dip_threshold:
                in_valley = True
                valley_start_idx = i
                # Calculate pre-valley frequency from buffer
                if confident_freq_buffer:
                    weights = np.array(confident_conf_buffer)
                    pre_valley_freq = np.average(confident_freq_buffer, weights=weights)
                else:
                    pre_valley_freq = freq

        else:  # in_valley
            # Check for recovery
            if conf >= recovery_threshold and freq > 0:
                # Check if pitch changed significantly
                post_valley_freq = freq

                if pre_valley_freq > 0 and post_valley_freq > 0:
                    semitone_change = abs(12 * np.log2(post_valley_freq / pre_valley_freq))

                    # Check minimum gap from last valley
                    time_since_last = time - last_valley_time if last_valley_time >= 0 else float('inf')

                    if semitone_change >= min_semitone_change and time_since_last >= min_gap_sec:
                        valleys.append(time)
                        last_valley_time = time

                        pre_midi = frequency_to_nearest_midi(pre_valley_freq)
                        post_midi = frequency_to_nearest_midi(post_valley_freq)
                        logger.log(
                            f"  Valley detected at {time:.3f}s: "
                            f"{midi_to_note_name(pre_midi)} ({pre_valley_freq:.1f}Hz) -> "
                            f"{midi_to_note_name(post_midi)} ({post_valley_freq:.1f}Hz) "
                            f"({semitone_change:.1f} semitones)"
                        )
                    else:
                        if semitone_change < min_semitone_change:
                            logger.log(f"  Valley at {time:.3f}s rejected: only {semitone_change:.1f} semitones change")
                        else:
                            logger.log(f"  Valley at {time:.3f}s rejected: too close to previous ({time_since_last*1000:.0f}ms)")

                # Exit valley and reset buffer
                in_valley = False
                confident_freq_buffer = [freq]
                confident_conf_buffer = [conf]

    logger.log(f"  Result: {len(valleys)} confidence valleys detected")
    return valleys


def segment_by_onsets(
    onsets: list[float],
    raw_time: np.ndarray,
    raw_frequency: np.ndarray,
    raw_confidence: np.ndarray,
    attack_skip_ms: float = 100.0,
    min_confidence: float = 0.5,
    end_time: Optional[float] = None,
    detect_pitch_boundaries: bool = True,
) -> list[PitchSegment]:
    """
    Create note segments using onsets as boundaries and finding stable pitch in each region.

    This is a fundamentally different approach from the old absorption method:
    1. Onsets define when notes START (not when segments match)
    2. Also detect pitch boundaries via confidence valleys (legato transitions)
    3. For each onset region, skip the attack transient
    4. Find the dominant/stable pitch in the remaining frames
    5. Create a segment with that pitch

    Args:
        onsets: List of onset timestamps in seconds
        raw_time: Raw CREPE time array
        raw_frequency: Raw CREPE frequency array
        raw_confidence: Raw CREPE confidence array
        attack_skip_ms: Time to skip after onset for pitch to stabilize (default 100ms)
        min_confidence: Minimum confidence for frames to be considered
        end_time: End time of the audio (uses last CREPE frame if not provided)
        detect_pitch_boundaries: If True, also detect note boundaries via confidence valleys

    Returns:
        List of PitchSegments, one per detected note
    """
    logger = get_logger()

    # First, detect confidence valleys to find pitch-based boundaries
    all_boundaries = list(onsets)  # Start with amplitude onsets

    if detect_pitch_boundaries:
        # Use shorter min_gap to catch faster singing tempos
        # 40ms is roughly a 32nd note at 180 BPM - fast enough for most singing
        confidence_valleys = detect_confidence_valleys(
            raw_time=raw_time,
            raw_frequency=raw_frequency,
            raw_confidence=raw_confidence,
            dip_threshold=0.5,
            recovery_threshold=0.6,
            min_semitone_change=1.5,
            min_gap_ms=40.0,  # Reduced from 100ms to catch faster tempos
        )

        # Merge confidence valleys with onsets, avoiding duplicates
        # Be more conservative about valleys close to amplitude onsets - they may just be
        # pitch stabilization during the attack phase, not real note changes
        for valley_time in confidence_valleys:
            # Check distance to nearest amplitude onset (stricter - must be outside attack phase)
            min_dist_to_onset = min(abs(valley_time - onset) for onset in onsets) if onsets else float('inf')

            # Check distance to other confidence valleys (can be closer)
            other_valleys = [b for b in all_boundaries if b not in onsets]
            min_dist_to_valley = min(abs(valley_time - v) for v in other_valleys) if other_valleys else float('inf')

            # Valley must be at least 100ms from amplitude onsets (outside attack phase)
            # but only 50ms from other valleys
            if min_dist_to_onset >= 0.10:  # 100ms from amplitude onsets
                # Also check it's not too close to existing valleys
                if min_dist_to_valley >= 0.05:  # 50ms from other valleys
                    all_boundaries.append(valley_time)
                    logger.log(f"  Added confidence valley at {valley_time:.3f}s as note boundary")
                else:
                    logger.log(f"  Skipped valley at {valley_time:.3f}s: too close to existing valley ({min_dist_to_valley*1000:.0f}ms)")
            else:
                logger.log(f"  Skipped valley at {valley_time:.3f}s: within attack phase of onset ({min_dist_to_onset*1000:.0f}ms from onset)")

        # Sort all boundaries
        all_boundaries = sorted(all_boundaries)

    logger.log_subsection("Onset-Based Segmentation")
    logger.log(f"  Parameters: attack_skip={attack_skip_ms}ms, min_confidence={min_confidence}")
    logger.log(f"  Amplitude onsets ({len(onsets)}): {', '.join(f'{t:.3f}s' for t in onsets)}")
    if detect_pitch_boundaries:
        logger.log(f"  All boundaries ({len(all_boundaries)}): {', '.join(f'{t:.3f}s' for t in all_boundaries)}")

    if len(all_boundaries) == 0:
        logger.log("  No note boundaries detected - cannot create segments")
        return []

    if len(raw_time) == 0:
        logger.log("  No CREPE frames - cannot create segments")
        return []

    attack_skip_sec = attack_skip_ms / 1000.0
    if end_time is None:
        end_time = float(raw_time[-1]) + 0.01  # Small buffer after last frame

    segments = []

    for i, boundary in enumerate(all_boundaries):
        # Determine the end of this note region (next boundary or end of audio)
        if i + 1 < len(all_boundaries):
            region_end = all_boundaries[i + 1]
        else:
            region_end = end_time

        # Skip attack transient - look for stable pitch after this point
        stable_start = boundary + attack_skip_sec

        # Find CREPE frames in the stable region
        mask = (
            (raw_time >= stable_start) &
            (raw_time < region_end) &
            (raw_confidence >= min_confidence) &
            (raw_frequency > 0)
        )

        stable_times = raw_time[mask]
        stable_freqs = raw_frequency[mask]
        stable_confs = raw_confidence[mask]

        logger.log(f"\n  Note {i+1}: boundary={boundary:.3f}s, region={boundary:.3f}s-{region_end:.3f}s")
        logger.log(f"    Stable region (after {attack_skip_ms}ms): {stable_start:.3f}s-{region_end:.3f}s")
        logger.log(f"    Confident frames in stable region: {len(stable_freqs)}")

        if len(stable_freqs) == 0:
            # No confident frames - try without skipping attack
            logger.log(f"    No confident frames after attack skip, trying full region...")
            mask_full = (
                (raw_time >= boundary) &
                (raw_time < region_end) &
                (raw_confidence >= min_confidence) &
                (raw_frequency > 0)
            )
            stable_times = raw_time[mask_full]
            stable_freqs = raw_frequency[mask_full]
            stable_confs = raw_confidence[mask_full]
            logger.log(f"    Confident frames in full region: {len(stable_freqs)}")

        if len(stable_freqs) == 0:
            # Still no frames - try with lower confidence threshold
            logger.log(f"    Still no frames, trying min_confidence=0.3...")
            mask_low = (
                (raw_time >= boundary) &
                (raw_time < region_end) &
                (raw_confidence >= 0.3) &
                (raw_frequency > 0)
            )
            stable_times = raw_time[mask_low]
            stable_freqs = raw_frequency[mask_low]
            stable_confs = raw_confidence[mask_low]
            logger.log(f"    Confident frames with lower threshold: {len(stable_freqs)}")

        if len(stable_freqs) == 0:
            logger.log(f"    WARNING: No usable frames for this boundary, skipping")
            continue

        # Find the dominant pitch using confidence-weighted median
        # Median is more robust to outliers than mean
        sorted_indices = np.argsort(stable_freqs)
        sorted_freqs = stable_freqs[sorted_indices]
        sorted_confs = stable_confs[sorted_indices]

        # Weighted median: find the frequency where cumulative weight crosses 50%
        cumulative_weight = np.cumsum(sorted_confs)
        total_weight = cumulative_weight[-1]
        median_idx = np.searchsorted(cumulative_weight, total_weight / 2)
        dominant_freq = sorted_freqs[min(median_idx, len(sorted_freqs) - 1)]

        # Also calculate mean for comparison
        mean_freq = np.average(stable_freqs, weights=stable_confs)
        avg_confidence = float(np.mean(stable_confs))

        # Convert to MIDI
        midi_note = frequency_to_nearest_midi(dominant_freq)
        note_name = midi_to_note_name(midi_note)

        logger.log(f"    Frequency analysis:")
        logger.log(f"      Range: {stable_freqs.min():.1f}Hz - {stable_freqs.max():.1f}Hz")
        logger.log(f"      Weighted median: {dominant_freq:.1f}Hz")
        logger.log(f"      Weighted mean: {mean_freq:.1f}Hz")
        logger.log(f"      -> MIDI {midi_note} ({note_name})")

        # Create segment from boundary to region end
        segment = PitchSegment(
            start_time=boundary,
            end_time=region_end,
            avg_frequency=dominant_freq,
            avg_confidence=avg_confidence,
            midi_note=midi_note,
        )
        segments.append(segment)

    logger.log(f"\n  Result: {len(segments)} segments from {len(all_boundaries)} boundaries")
    return segments


def merge_same_pitch_segments(
    segments: list[PitchSegment],
    ratio_tolerance: float = 0.03,  # ~50 cents
) -> list[PitchSegment]:
    """
    Merge consecutive segments that have approximately the same pitch.

    Args:
        segments: List of pitch segments
        ratio_tolerance: Maximum deviation from ratio 1.0 to consider same pitch

    Returns:
        List with consecutive same-pitch segments merged
    """
    logger = get_logger()
    logger.log_subsection(f"Same-Pitch Merging (tolerance: {ratio_tolerance:.3f} = ~{ratio_tolerance * 100 / 0.06:.0f} cents)")

    if not segments:
        logger.log("  No segments to merge")
        return []

    merged = []
    current = segments[0]
    merge_count = 0

    logger.log(f"  Starting with: {midi_to_note_name(current.midi_note)} ({current.avg_frequency:.1f}Hz)")

    for i, next_seg in enumerate(segments[1:], 1):
        # Calculate ratio between current and next
        if current.avg_frequency > 0:
            ratio = next_seg.avg_frequency / current.avg_frequency
        else:
            ratio = float('inf')

        cents_diff = abs(1200 * np.log2(ratio)) if ratio > 0 and ratio != float('inf') else float('inf')

        # If ratio is approximately 1.0, merge
        if abs(ratio - 1.0) <= ratio_tolerance:
            merge_count += 1
            logger.log(
                f"  MERGE #{i}: {midi_to_note_name(next_seg.midi_note)} ({next_seg.avg_frequency:.1f}Hz) "
                f"into current - ratio={ratio:.4f} ({cents_diff:.1f} cents)"
            )

            # Merge: extend end time, recalculate averages
            total_duration = (current.end_time - current.start_time) + (next_seg.end_time - next_seg.start_time)
            current_duration = current.end_time - current.start_time
            next_duration = next_seg.end_time - next_seg.start_time

            # Weighted average of frequency and confidence
            if total_duration > 0:
                new_freq = (current.avg_frequency * current_duration + next_seg.avg_frequency * next_duration) / total_duration
                new_conf = (current.avg_confidence * current_duration + next_seg.avg_confidence * next_duration) / total_duration
            else:
                new_freq = current.avg_frequency
                new_conf = current.avg_confidence

            current = PitchSegment(
                start_time=current.start_time,
                end_time=next_seg.end_time,
                avg_frequency=new_freq,
                avg_confidence=new_conf,
                midi_note=current.midi_note,  # Will be recalculated later
            )
        else:
            # Different pitch, save current and start new
            logger.log(
                f"  NEW #{i}: {midi_to_note_name(next_seg.midi_note)} ({next_seg.avg_frequency:.1f}Hz) "
                f"- ratio={ratio:.4f} ({cents_diff:.1f} cents) -> new segment"
            )
            merged.append(current)
            current = next_seg

    # Don't forget the last segment
    merged.append(current)

    logger.log(f"  Result: {len(merged)} segments after {merge_count} merges")
    return merged


def extract_intervals(segments: list[PitchSegment], anchor_midi: Optional[int] = None) -> list[int]:
    """
    Extract semitone intervals between consecutive segments using key-aware snapping.

    This function tracks the "running" MIDI note as it applies intervals, so that
    key-aware snapping can check if candidate notes are in the key.

    Args:
        segments: List of pitch segments (must have at least 2)
        anchor_midi: MIDI note of the first segment (anchor). If None, uses segment's midi_note.

    Returns:
        List of intervals in semitones (length = len(segments) - 1)
    """
    logger = get_logger()
    key = get_key()
    key_str = f" in key" if key else " (no key set)"
    logger.log_subsection(f"Interval Extraction (key-aware snapping{key_str})")

    if len(segments) < 2:
        logger.log("  Not enough segments for intervals")
        return []

    # Track the running MIDI note for key-aware snapping
    # Start with the anchor (first note's rounded MIDI)
    if anchor_midi is not None:
        current_midi = anchor_midi
    else:
        current_midi = frequency_to_nearest_midi(segments[0].avg_frequency)

    logger.log(f"  Starting from: {midi_to_note_name(current_midi)} (MIDI {current_midi})")

    intervals = []
    for i in range(len(segments) - 1):
        freq1 = segments[i].avg_frequency
        freq2 = segments[i + 1].avg_frequency
        ratio = freq2 / freq1 if freq1 > 0 else 0
        raw_semitones = 12 * np.log2(ratio) if ratio > 0 else 0

        # Use key-aware interval calculation with the current (corrected) MIDI note
        interval = calculate_interval_semitones(freq1, freq2, source_midi=current_midi)

        # Calculate what the next MIDI note will be
        next_midi = current_midi + interval

        # Determine what kind of snapping was applied
        fraction = raw_semitones - np.floor(raw_semitones)
        simple_round = int(round(raw_semitones))
        lower = int(np.floor(raw_semitones))
        upper = lower + 1
        nearest = lower if fraction < 0.5 else upper
        snap_note = ""

        # Check if key snapping was applied
        if key is not None:
            lower_target = current_midi + lower
            upper_target = current_midi + upper
            lower_in_key = is_note_in_key(lower_target, key)
            upper_in_key = is_note_in_key(upper_target, key)

            # Key snapping only applies when exactly one candidate is in key
            if lower_in_key != upper_in_key:
                in_key_interval = lower if lower_in_key else upper
                if interval == in_key_interval and interval != nearest:
                    # Key overrode the nearest rounding
                    dist = abs(raw_semitones - interval)
                    snap_note = f" [KEY SNAP dist={dist:.2f}]"
                elif interval == in_key_interval:
                    snap_note = " [KEY->nearest]"
            elif 0.35 < fraction < 0.65:
                # Both in key or neither - check if musical preference was used
                if interval != simple_round:
                    snap_note = " [MUSICAL PREF]"
                else:
                    snap_note = " [ambiguous]"
        elif 0.35 < fraction < 0.65:
            # No key, in ambiguous zone
            if interval != simple_round:
                snap_note = " [MUSICAL PREF]"
            else:
                snap_note = " [ambiguous]"

        interval_name = f"+{interval}" if interval >= 0 else str(interval)
        logger.log(
            f"  {i+1}->{i+2}: {midi_to_note_name(current_midi)} ({freq1:.1f}Hz) -> "
            f"{midi_to_note_name(next_midi)} ({freq2:.1f}Hz) "
            f"| raw={raw_semitones:.2f} -> {interval_name}{snap_note}"
        )

        intervals.append(interval)
        current_midi = next_midi  # Update running MIDI for next iteration

    return intervals


def apply_intervals_from_anchor(
    anchor_midi: int,
    intervals: list[int],
) -> list[int]:
    """
    Generate MIDI note numbers by applying intervals from an anchor note.

    Args:
        anchor_midi: MIDI note number of the first note
        intervals: List of semitone intervals

    Returns:
        List of MIDI note numbers (length = len(intervals) + 1)
    """
    logger = get_logger()
    logger.log_subsection("Applying Intervals from Anchor")
    logger.log(f"  Anchor: MIDI {anchor_midi} ({midi_to_note_name(anchor_midi)})")

    notes = [anchor_midi]
    current = anchor_midi

    for i, interval in enumerate(intervals):
        prev = current
        current = current + interval
        # Clamp to valid MIDI range
        clamped = current != max(0, min(127, current))
        current = max(0, min(127, current))
        notes.append(current)

        interval_str = f"+{interval}" if interval >= 0 else str(interval)
        clamp_warning = " [CLAMPED!]" if clamped else ""
        logger.log(
            f"  Note {i+2}: {midi_to_note_name(prev)} {interval_str} -> {midi_to_note_name(current)} (MIDI {current}){clamp_warning}"
        )

    return notes


def process_segments_with_intervals(
    segments: list[PitchSegment],
    min_duration_ms: float = 75.0,
    log_raw_frames: bool = False,
    raw_time: Optional[np.ndarray] = None,
    raw_frequency: Optional[np.ndarray] = None,
    raw_confidence: Optional[np.ndarray] = None,
    onsets: Optional[list[float]] = None,
    key: Optional[tuple[str, str]] = None,
) -> list[PitchSegment]:
    """
    Main function: Process segments using interval-based approach with key-aware snapping.

    1. Filter by minimum duration
    1.5. Absorb transitions (segments without onsets)
    2. Merge same-pitch segments
    3. Set key context if provided
    4. Calculate anchor note
    5. Extract intervals (with key-aware snapping)
    6. Apply intervals to get final MIDI notes

    Args:
        segments: Raw pitch segments from CREPE
        min_duration_ms: Minimum note duration
        log_raw_frames: If True, log raw CREPE frames (requires raw_* arrays)
        raw_time: Raw CREPE time array (for logging)
        raw_frequency: Raw CREPE frequency array (for logging)
        raw_confidence: Raw CREPE confidence array (for logging)
        onsets: Onset timestamps in seconds (for transition absorption)
        key: Optional tuple of (root_note, scale_type) e.g. ('C#', 'major')
             If provided, enables key-aware interval snapping.

    Returns:
        Processed segments with interval-derived MIDI notes
    """
    logger = get_logger()
    logger.log_section("INTERVAL-BASED PITCH PROCESSING")
    logger.log(f"Timestamp: {datetime.now().isoformat()}")
    logger.log(f"Input: {len(segments)} segments, min_duration={min_duration_ms}ms")

    # Set up key context if provided
    if key is not None:
        root_note, scale_type = key
        set_key(root_note, scale_type)
        scale_notes = get_scale_notes_in_key()
        note_names = [MIDI_NOTE_NAMES[pc] for pc in sorted(scale_notes)]
        logger.log(f"Key context: {root_note} {scale_type} -> {', '.join(note_names)}")
    else:
        clear_key()
        logger.log("Key context: None (chromatic/no key awareness)")

    # Log raw CREPE frames if provided
    if log_raw_frames and raw_time is not None and raw_frequency is not None and raw_confidence is not None:
        logger.log_subsection("Raw CREPE Frames (10ms samples)")
        logger.log(f"  Total frames: {len(raw_time)}")
        logger.log(f"  {'Time':>8s}  {'Freq':>8s}  {'Conf':>6s}  {'MIDI':>4s}  Note")
        logger.log(f"  {'-'*8}  {'-'*8}  {'-'*6}  {'-'*4}  {'-'*6}")
        for t, f, c in zip(raw_time, raw_frequency, raw_confidence):
            if c >= 0.3 and f > 0:  # Only log confident frames
                midi = frequency_to_nearest_midi(f)
                note = midi_to_note_name(midi)
                logger.log(f"  {t:8.3f}  {f:8.1f}  {c:6.3f}  {midi:4d}  {note}")

    # Log input segments
    logger.log_subsection("Input Segments (from CREPE grouping)")
    for i, seg in enumerate(segments):
        duration_ms = (seg.end_time - seg.start_time) * 1000
        note_name = midi_to_note_name(seg.midi_note)
        logger.log(
            f"  {i+1}. {note_name} (MIDI {seg.midi_note}, {seg.avg_frequency:.1f}Hz) "
            f"@ {seg.start_time:.3f}s-{seg.end_time:.3f}s ({duration_ms:.1f}ms) "
            f"conf={seg.avg_confidence:.2f}"
        )

    if not segments:
        logger.log("  No input segments - returning empty")
        return []

    # NEW APPROACH: Use onsets to define note boundaries
    # If we have onsets and raw CREPE data, use onset-based segmentation
    if onsets is not None and len(onsets) > 0 and raw_time is not None and raw_frequency is not None and raw_confidence is not None:
        logger.log(f"\n  Using ONSET-BASED segmentation ({len(onsets)} onsets detected)")

        # Create segments directly from onsets
        # Use 50ms attack skip (reduced from 100ms) to handle faster tempos
        onset_segments = segment_by_onsets(
            onsets=onsets,
            raw_time=raw_time,
            raw_frequency=raw_frequency,
            raw_confidence=raw_confidence,
            attack_skip_ms=50.0,  # Skip first 50ms after onset for pitch to stabilize
            min_confidence=0.5,
        )

        if onset_segments:
            # Use onset-based segments instead of CREPE grouping
            merged = onset_segments
        else:
            logger.log("  Onset-based segmentation produced no segments, falling back to old method")
            # Fall back to old method
            filtered = filter_by_duration(segments, min_duration_ms)
            if not filtered:
                logger.log("  All segments filtered out - returning empty")
                return []
            merged = merge_same_pitch_segments(filtered)
    else:
        # OLD APPROACH: Filter by duration and merge (no onset information available)
        logger.log(f"\n  Using DURATION-BASED filtering (no onsets available)")
        filtered = filter_by_duration(segments, min_duration_ms)
        if not filtered:
            logger.log("  All segments filtered out - returning empty")
            return []
        merged = merge_same_pitch_segments(filtered)

    if not merged:
        logger.log("  No segments after processing - returning empty")
        return []

    # Step 3: Determine anchor from first note (needed for key-aware interval extraction)
    anchor_freq = merged[0].avg_frequency
    anchor_midi = frequency_to_nearest_midi(anchor_freq)
    raw_midi = 69 + 12 * np.log2(anchor_freq / 440.0)

    logger.log_subsection("Anchor Note Calculation")
    logger.log(f"  First segment frequency: {anchor_freq:.1f}Hz")
    logger.log(f"  Raw MIDI (unrounded): {raw_midi:.2f}")
    logger.log(f"  Rounded MIDI: {anchor_midi} ({midi_to_note_name(anchor_midi)})")

    # Step 4: Extract intervals (with key-aware snapping using anchor)
    intervals = extract_intervals(merged, anchor_midi=anchor_midi)

    # Step 5: Apply intervals to get all MIDI notes
    midi_notes = apply_intervals_from_anchor(anchor_midi, intervals)

    # Step 6: Create new segments with corrected MIDI notes
    result = []
    for i, seg in enumerate(merged):
        result.append(PitchSegment(
            start_time=seg.start_time,
            end_time=seg.end_time,
            avg_frequency=seg.avg_frequency,
            avg_confidence=seg.avg_confidence,
            midi_note=midi_notes[i],
        ))

    # Log final result
    logger.log_subsection("FINAL OUTPUT")
    for i, seg in enumerate(result):
        duration_ms = (seg.end_time - seg.start_time) * 1000
        note_name = midi_to_note_name(seg.midi_note)
        logger.log(
            f"  {i+1}. {note_name} (MIDI {seg.midi_note}) "
            f"@ {seg.start_time:.3f}s-{seg.end_time:.3f}s ({duration_ms:.1f}ms)"
        )

    return result
