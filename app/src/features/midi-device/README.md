# MIDI Device Feature

## Purpose

Connect MIDI input and output devices.

## Entry Point

`MIDIDeviceView` is the settings screen. It lists input and output devices with checkboxes to enable them, and offers Bluetooth MIDI scanning where supported.

## Responsibilities

- List devices. Enable or disable them.
- Route playback to the built-in synthesizer and external outputs.
- Find and connect Bluetooth MIDI devices where supported.

## Design Notes

- Device state lives in shared stores. This feature shows it and applies the user's choices to playback output.
- Behavior depends on browser support and permissions. Devices can appear or disappear at any time.
