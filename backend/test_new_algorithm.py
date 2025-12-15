"""
Test the new onset-based + confidence valley segmentation algorithm
on existing log data from voice_to_midi_20251215_144124.txt.

Expected: A2 - E3 - C#3 - E3 - F#3 - E3 (6 notes)
"""

import re
import numpy as np
import sys
sys.path.insert(0, '/Users/courtneyblaskovich/Documents/Projects/signal/backend')

from app.services.interval_processing import (
    segment_by_onsets,
    detect_confidence_valleys,
    extract_intervals,
    apply_intervals_from_anchor,
    frequency_to_nearest_midi,
    midi_to_note_name,
    create_new_logger,
    get_logger,
)


def parse_crepe_frames(log_text: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Extract CREPE frames from log file."""
    times = []
    freqs = []
    confs = []

    # Pattern for CREPE frame lines: "     0.700     170.4   0.422    53  F3"
    pattern = r'^\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+\d+\s+\w+#?\d'

    for line in log_text.split('\n'):
        match = re.match(pattern, line)
        if match:
            times.append(float(match.group(1)))
            freqs.append(float(match.group(2)))
            confs.append(float(match.group(3)))

    return np.array(times), np.array(freqs), np.array(confs)


def parse_onsets(log_text: str) -> list[float]:
    """Extract onset timestamps from log file."""
    # Pattern: "  Onset timestamps: 0.930s, 1.370s, 2.220s, 2.650s, 3.110s"
    pattern = r'Onset timestamps:\s*([\d.s,\s]+)'
    match = re.search(pattern, log_text)
    if match:
        timestamps = re.findall(r'([\d.]+)s', match.group(1))
        return [float(t) for t in timestamps]
    return []


def main():
    # Read the log file
    with open('logs/voice_to_midi_20251215_144124.txt', 'r') as f:
        log_text = f.read()

    # Parse CREPE frames
    raw_time, raw_frequency, raw_confidence = parse_crepe_frames(log_text)

    # Parse onsets
    onsets = parse_onsets(log_text)

    # Expected output
    expected_notes = ['A2', 'E3', 'C#3', 'E3', 'F#3', 'E3']
    expected_midi = [45, 52, 49, 52, 54, 52]

    print("=" * 70)
    print("TEST: Confidence Valley Detection + Onset-Based Segmentation")
    print("=" * 70)
    print()
    print(f"Expected: {' - '.join(expected_notes)} ({len(expected_notes)} notes)")
    print(f"Expected MIDI: {', '.join(map(str, expected_midi))}")
    print()
    print(f"Amplitude onsets: {onsets}")
    print(f"CREPE frames: {len(raw_time)}")
    print()

    # Create a new logger
    logger = create_new_logger()

    # First, let's see what confidence valleys are detected
    print("=" * 70)
    print("CONFIDENCE VALLEY DETECTION:")
    print("=" * 70)

    valleys = detect_confidence_valleys(
        raw_time=raw_time,
        raw_frequency=raw_frequency,
        raw_confidence=raw_confidence,
        dip_threshold=0.5,
        recovery_threshold=0.6,
        min_semitone_change=1.5,
        min_gap_ms=100.0,
    )
    print(f"Valleys detected: {valleys}")
    print()

    # Now run the full segmentation
    print("=" * 70)
    print("RESULTS FROM segment_by_onsets (with pitch boundary detection):")
    print("=" * 70)

    # Reset logger for clean output
    logger = create_new_logger()

    segments = segment_by_onsets(
        onsets=onsets,
        raw_time=raw_time,
        raw_frequency=raw_frequency,
        raw_confidence=raw_confidence,
        attack_skip_ms=100.0,
        min_confidence=0.5,
        detect_pitch_boundaries=True,
    )

    for i, seg in enumerate(segments):
        duration_ms = (seg.end_time - seg.start_time) * 1000
        note_name = midi_to_note_name(seg.midi_note)
        print(f"  {i+1}. {note_name} (MIDI {seg.midi_note}) @ {seg.start_time:.3f}s-{seg.end_time:.3f}s ({duration_ms:.0f}ms)")

    print(f"\nTotal segments: {len(segments)}")

    # Extract intervals and apply from anchor
    print()
    print("=" * 70)
    print("AFTER INTERVAL CORRECTION:")
    print("=" * 70)

    if segments:
        intervals = extract_intervals(segments)
        anchor_freq = segments[0].avg_frequency
        anchor_midi = frequency_to_nearest_midi(anchor_freq)

        print(f"\nAnchor: {midi_to_note_name(anchor_midi)} (MIDI {anchor_midi}) from {anchor_freq:.1f}Hz")
        print(f"Intervals: {intervals}")

        final_midi = apply_intervals_from_anchor(anchor_midi, intervals)
        final_names = [midi_to_note_name(m) for m in final_midi]

        print(f"\nFinal MIDI notes: {final_midi}")
        print(f"Final note names: {final_names}")

    # Compare to expected
    print()
    print("=" * 70)
    print("COMPARISON:")
    print("=" * 70)

    # Compare raw segments (before interval correction)
    raw_midi = [seg.midi_note for seg in segments]
    raw_names = [midi_to_note_name(m) for m in raw_midi]

    print(f"\nRAW (before interval correction):")
    print(f"  Got:      {' - '.join(raw_names)}")
    print(f"  Expected: {' - '.join(expected_notes)}")

    # Count raw matches
    raw_matches = 0
    max_len = min(len(raw_midi), len(expected_midi))
    print(f"\nNote   Expected     Got (raw)    Match")
    print("-" * 40)
    for i in range(max(len(expected_midi), len(raw_midi))):
        exp = expected_notes[i] if i < len(expected_notes) else "-"
        exp_midi = expected_midi[i] if i < len(expected_midi) else "-"
        got = raw_names[i] if i < len(raw_names) else "-"
        got_midi = raw_midi[i] if i < len(raw_midi) else "-"
        match = "✓" if i < len(expected_midi) and i < len(raw_midi) and raw_midi[i] == expected_midi[i] else "✗"
        if match == "✓":
            raw_matches += 1
        print(f"{i+1:<6} {exp:<12} {got:<12} {match}")

    print(f"\nRaw accuracy: {raw_matches}/{max(len(expected_midi), len(raw_midi))} ({100*raw_matches/max(len(expected_midi), len(raw_midi)):.0f}%)")

    # Print detailed log
    print()
    print("=" * 70)
    print("DETAILED LOG:")
    print("=" * 70)
    print(logger.get_log())


if __name__ == "__main__":
    main()
