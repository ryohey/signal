# Synthesizer Feature

## Purpose

Tune the SoundFont synthesizer: sample rate and a few of SpessaSynth's global system parameters.

## Entry Point

`SynthesizerSettingsView` is the settings screen, shown under SoundFont in `SettingDialog`.

## Responsibilities

- Sample rate of the `AudioContext`. It can only be set when a context is created, so changing it saves the rate and reloads the app. A warning first lists what gets lost (the open song, unsaved changes, playback) and recommends saving first or changing it with no song open. The reload skips the usual "unsaved changes" prompt, which in Electron would close the window instead.
- Master volume, interpolation, voice limit, effect levels (reverb, chorus, delay, variation) and a few behavior switches (monophonic retrigger, custom vibrato, pitch-based key shift).
- Apply the same parameters and sample rate to WAV/MP3 export. The voice limit is the exception. spessasynth's offline render allocates voices as needed, and `renderAudio` doesn't send the limit, so export never cuts notes. MP3 export normalizes to the peak, so master volume only changes the level of WAV files.

## Design Notes

- Values live in `services/synthesizerSettings.ts` (localStorage) so `RootStore` can read them before React starts. A stored rate the browser rejects at startup is dropped.
- `RootStore` keeps the rate it started with. The UI and export read it from there. If the rate can't be saved, the app doesn't reload.
- The synth state (programs, controllers, SysEx) can't be copied to a new spessasynth synth, so rebuilding it from the song kept missing cases. A reload starts from the same state as opening the app.
- Sliders apply while dragging and save when released.
- The parameters are applied to the main synth only, not the metronome.
- Export uses 44100 Hz when no sample rate is chosen, like before.
