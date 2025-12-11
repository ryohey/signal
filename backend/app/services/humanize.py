"""
Humanization utilities for MIDI generation.
These can be included in the generated code or applied post-generation.
"""

import random


def humanize_timing(time: float, variance: float = 0.02) -> float:
    """Add slight timing variation (±variance beats)."""
    return time + random.uniform(-variance, variance)


def humanize_velocity(velocity: int, variance: int = 10) -> int:
    """Add velocity variation while staying in MIDI range."""
    new_vel = velocity + random.randint(-variance, variance)
    return max(1, min(127, new_vel))


# Code snippet to inject into generated code
HUMANIZE_CODE = """
import random

def humanize_timing(time, variance=0.02):
    return time + random.uniform(-variance, variance)

def humanize_velocity(velocity, variance=10):
    return max(1, min(127, velocity + random.randint(-variance, variance)))
"""
