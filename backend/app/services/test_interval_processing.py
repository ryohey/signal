"""Tests for interval processing module."""
import pytest
from app.models.schemas import PitchSegment
from app.services.interval_processing import (
    frequency_to_nearest_midi,
    calculate_interval_semitones,
    filter_by_duration,
    merge_same_pitch_segments,
    extract_intervals,
    apply_intervals_from_anchor,
    process_segments_with_intervals,
)


class TestFrequencyToMidi:
    def test_a4_440hz(self):
        assert frequency_to_nearest_midi(440.0) == 69

    def test_slightly_flat_a4(self):
        # 438 Hz should still round to A4 (69)
        assert frequency_to_nearest_midi(438.0) == 69

    def test_c4(self):
        assert frequency_to_nearest_midi(261.63) == 60

    def test_zero_frequency(self):
        assert frequency_to_nearest_midi(0) == 0

    def test_negative_frequency(self):
        assert frequency_to_nearest_midi(-100) == 0

    def test_e5(self):
        # E5 is MIDI note 76, frequency ~659.26 Hz
        assert frequency_to_nearest_midi(659.26) == 76

    def test_csharp5(self):
        # C#5 is MIDI note 73, frequency ~554.37 Hz
        assert frequency_to_nearest_midi(554.37) == 73


class TestCalculateIntervalSemitones:
    def test_perfect_fifth_up(self):
        # A4 to E5 (ratio ~1.498)
        interval = calculate_interval_semitones(440.0, 659.0)
        assert interval == 7  # Perfect fifth = 7 semitones

    def test_minor_third_down(self):
        # E5 to C#5 (ratio ~0.84)
        interval = calculate_interval_semitones(659.0, 554.0)
        assert interval == -3  # Minor third down = -3 semitones

    def test_unison(self):
        interval = calculate_interval_semitones(440.0, 442.0)
        assert interval == 0

    def test_octave_up(self):
        interval = calculate_interval_semitones(440.0, 880.0)
        assert interval == 12

    def test_octave_down(self):
        interval = calculate_interval_semitones(880.0, 440.0)
        assert interval == -12

    def test_issue_example_first_interval(self):
        # From issue: 438 Hz -> 656 Hz (should be +7, perfect fifth)
        interval = calculate_interval_semitones(438.0, 656.0)
        assert interval == 7

    def test_issue_example_second_interval(self):
        # From issue: 656 Hz -> 552 Hz (should be -3, minor third)
        interval = calculate_interval_semitones(656.0, 552.0)
        assert interval == -3

    def test_zero_frequencies(self):
        assert calculate_interval_semitones(0, 440.0) == 0
        assert calculate_interval_semitones(440.0, 0) == 0
        assert calculate_interval_semitones(0, 0) == 0


class TestFilterByDuration:
    def test_removes_short_segments(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.05, avg_frequency=440, avg_confidence=0.9, midi_note=69),  # 50ms - too short
            PitchSegment(start_time=0.1, end_time=0.2, avg_frequency=440, avg_confidence=0.9, midi_note=69),   # 100ms - ok
        ]
        filtered = filter_by_duration(segments, min_duration_ms=75.0)
        assert len(filtered) == 1
        assert filtered[0].start_time == 0.1

    def test_keeps_long_segments(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.5, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.5, end_time=1.0, avg_frequency=660, avg_confidence=0.9, midi_note=76),
        ]
        filtered = filter_by_duration(segments, min_duration_ms=75.0)
        assert len(filtered) == 2

    def test_empty_list(self):
        filtered = filter_by_duration([], min_duration_ms=75.0)
        assert len(filtered) == 0

    def test_all_filtered(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.05, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.1, end_time=0.14, avg_frequency=660, avg_confidence=0.9, midi_note=76),
        ]
        filtered = filter_by_duration(segments, min_duration_ms=75.0)
        assert len(filtered) == 0


class TestMergeSamePitchSegments:
    def test_merges_same_pitch(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.1, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.1, end_time=0.2, avg_frequency=442, avg_confidence=0.9, midi_note=69),  # ~same pitch
        ]
        merged = merge_same_pitch_segments(segments)
        assert len(merged) == 1
        assert merged[0].start_time == 0.0
        assert merged[0].end_time == 0.2

    def test_keeps_different_pitches(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.1, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.1, end_time=0.2, avg_frequency=660, avg_confidence=0.9, midi_note=76),  # Different pitch
        ]
        merged = merge_same_pitch_segments(segments)
        assert len(merged) == 2

    def test_empty_list(self):
        merged = merge_same_pitch_segments([])
        assert len(merged) == 0

    def test_single_segment(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.1, avg_frequency=440, avg_confidence=0.9, midi_note=69),
        ]
        merged = merge_same_pitch_segments(segments)
        assert len(merged) == 1

    def test_multiple_merges(self):
        # A A A E E -> A E
        segments = [
            PitchSegment(start_time=0.0, end_time=0.1, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.1, end_time=0.2, avg_frequency=441, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.2, end_time=0.3, avg_frequency=442, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.3, end_time=0.4, avg_frequency=660, avg_confidence=0.9, midi_note=76),
            PitchSegment(start_time=0.4, end_time=0.5, avg_frequency=658, avg_confidence=0.9, midi_note=76),
        ]
        merged = merge_same_pitch_segments(segments)
        assert len(merged) == 2
        assert merged[0].end_time == 0.3
        assert merged[1].start_time == 0.3


class TestExtractIntervals:
    def test_two_notes(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.5, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.5, end_time=1.0, avg_frequency=659, avg_confidence=0.9, midi_note=76),
        ]
        intervals = extract_intervals(segments)
        assert len(intervals) == 1
        assert intervals[0] == 7  # Perfect fifth

    def test_three_notes(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.5, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.5, end_time=1.0, avg_frequency=659, avg_confidence=0.9, midi_note=76),
            PitchSegment(start_time=1.0, end_time=1.5, avg_frequency=554, avg_confidence=0.9, midi_note=73),
        ]
        intervals = extract_intervals(segments)
        assert len(intervals) == 2
        assert intervals[0] == 7   # A to E = +7
        assert intervals[1] == -3  # E to C# = -3

    def test_single_note(self):
        segments = [
            PitchSegment(start_time=0.0, end_time=0.5, avg_frequency=440, avg_confidence=0.9, midi_note=69),
        ]
        intervals = extract_intervals(segments)
        assert len(intervals) == 0

    def test_empty_list(self):
        intervals = extract_intervals([])
        assert len(intervals) == 0


class TestApplyIntervalsFromAnchor:
    def test_single_interval(self):
        notes = apply_intervals_from_anchor(69, [7])  # A + perfect fifth
        assert notes == [69, 76]  # A, E

    def test_multiple_intervals(self):
        notes = apply_intervals_from_anchor(69, [7, -3])  # A -> E -> C#
        assert notes == [69, 76, 73]

    def test_no_intervals(self):
        notes = apply_intervals_from_anchor(69, [])
        assert notes == [69]

    def test_clamps_high(self):
        notes = apply_intervals_from_anchor(120, [12])  # Near top of MIDI range
        assert notes == [120, 127]  # Clamped to 127

    def test_clamps_low(self):
        notes = apply_intervals_from_anchor(5, [-12])  # Near bottom of MIDI range
        assert notes == [5, 0]  # Clamped to 0


class TestProcessSegmentsWithIntervals:
    def test_issue_example_a_e_csharp(self):
        """Test the example from issue.txt: A -> E -> C#"""
        segments = [
            PitchSegment(start_time=0.0, end_time=0.5, avg_frequency=438, avg_confidence=0.9, midi_note=69),   # Slightly flat A
            PitchSegment(start_time=0.5, end_time=1.0, avg_frequency=656, avg_confidence=0.9, midi_note=76),   # Slightly flat E
            PitchSegment(start_time=1.0, end_time=1.5, avg_frequency=552, avg_confidence=0.9, midi_note=73),   # Slightly flat C#
        ]

        result = process_segments_with_intervals(segments)

        assert len(result) == 3
        assert result[0].midi_note == 69  # A4 (anchor rounded from 438Hz)
        assert result[1].midi_note == 76  # E5 (A4 + 7 semitones)
        assert result[2].midi_note == 73  # C#5 (E5 - 3 semitones)

    def test_drift_still_works(self):
        """Test example with drift: 438 -> 659 -> 560"""
        segments = [
            PitchSegment(start_time=0.0, end_time=0.5, avg_frequency=438, avg_confidence=0.9, midi_note=69),   # Flat A
            PitchSegment(start_time=0.5, end_time=1.0, avg_frequency=659, avg_confidence=0.9, midi_note=76),   # Good E
            PitchSegment(start_time=1.0, end_time=1.5, avg_frequency=560, avg_confidence=0.9, midi_note=73),   # Sharp C#
        ]

        result = process_segments_with_intervals(segments)

        # Despite drift, intervals should give us A -> E -> C#
        assert result[0].midi_note == 69  # A4
        assert result[1].midi_note == 76  # E5
        assert result[2].midi_note == 73  # C#5

    def test_filters_short_segments(self):
        """Short segments should be filtered out"""
        segments = [
            PitchSegment(start_time=0.0, end_time=0.5, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.5, end_time=0.52, avg_frequency=500, avg_confidence=0.9, midi_note=71),  # 20ms - too short
            PitchSegment(start_time=0.6, end_time=1.1, avg_frequency=659, avg_confidence=0.9, midi_note=76),
        ]

        result = process_segments_with_intervals(segments)

        assert len(result) == 2
        assert result[0].midi_note == 69  # A
        assert result[1].midi_note == 76  # E

    def test_merges_same_pitch(self):
        """Same-pitch segments should be merged"""
        segments = [
            PitchSegment(start_time=0.0, end_time=0.3, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.3, end_time=0.6, avg_frequency=441, avg_confidence=0.9, midi_note=69),  # Same pitch
            PitchSegment(start_time=0.6, end_time=1.0, avg_frequency=659, avg_confidence=0.9, midi_note=76),
        ]

        result = process_segments_with_intervals(segments)

        assert len(result) == 2
        assert result[0].midi_note == 69  # A (merged)
        assert result[0].end_time == 0.6  # Extended
        assert result[1].midi_note == 76  # E

    def test_empty_input(self):
        result = process_segments_with_intervals([])
        assert len(result) == 0

    def test_all_filtered_out(self):
        """When all segments are too short"""
        segments = [
            PitchSegment(start_time=0.0, end_time=0.05, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=0.1, end_time=0.14, avg_frequency=659, avg_confidence=0.9, midi_note=76),
        ]

        result = process_segments_with_intervals(segments)
        assert len(result) == 0

    def test_single_note(self):
        """Single note should be processed correctly"""
        segments = [
            PitchSegment(start_time=0.0, end_time=0.5, avg_frequency=440, avg_confidence=0.9, midi_note=69),
        ]

        result = process_segments_with_intervals(segments)

        assert len(result) == 1
        assert result[0].midi_note == 69

    def test_preserves_timing(self):
        """Original timing should be preserved"""
        segments = [
            PitchSegment(start_time=0.5, end_time=1.0, avg_frequency=440, avg_confidence=0.9, midi_note=69),
            PitchSegment(start_time=1.5, end_time=2.0, avg_frequency=659, avg_confidence=0.9, midi_note=76),
        ]

        result = process_segments_with_intervals(segments)

        assert result[0].start_time == 0.5
        assert result[0].end_time == 1.0
        assert result[1].start_time == 1.5
        assert result[1].end_time == 2.0
