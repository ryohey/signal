# @signal-app/player

## Purpose

Provides MIDI event scheduling and playback components for Signal.

## Responsibilities

- Schedule MIDI events with stable timing.
- Manage playback lifecycle and loop behavior.
- Drive sound output through synthesizer adapters.

## Representative Classes and APIs

- `Player`
  - Core playback controller with `play`, `stop`, `reset`, `position`, loop controls, and channel-wide panic helpers (`allSoundsOff`).
  - Emits subscribe-style observables (`onPositionChanged`, `onIsPlayingChanged`, `onLoopChanged`) through a MobX adapter.
- `EventScheduler<E>`
  - Look-ahead scheduler converting tick windows to timestamped events.
  - Supports loop boundary stitching and loop-end cleanup event injection.
- `SoundFontSynth`
  - `SynthOutput` implementation backed by `WorkletSynthesizer`.
  - Handles channel events plus SysEx buffering and dispatch.
- `renderAudio(...)`
  - Offline rendering pipeline using `OfflineAudioContext` and SpessaSynth worklet.
  - Reports progress and supports cancellation.
- `SoundFont`
  - Loads/parses SF2/SF3 data and exposes drum-kit preset/sample metadata.

## Core Concepts

- EventScheduler: Reads and schedules chronological events.
- Player: Controls playback state and emits events to synth backends.

## Boundary Rules

- Keep transport and playback concerns isolated from app UI.
- Expose typed APIs suitable for both app and tooling use.

## Architecture Notes

- Uses event-source abstraction (`IEventSource`) so timeline/event retrieval is provided by consumers.
- Uses `SynthOutput` abstraction so output backend can vary (realtime synth, offline render target, etc.).
- Relies on millisecond tick conversion and throttled position sync to balance precision and UI update cost.

## Libraries and External Factors

- Dependencies: `spessasynth_core`, `spessasynth_lib`.
- Peer dependencies: `midifile-ts`, `mobx`, `lodash`.
- Requires Web Audio APIs (AudioContext/OfflineAudioContext + AudioWorklet); autoplay policies and browser support can affect startup timing.
