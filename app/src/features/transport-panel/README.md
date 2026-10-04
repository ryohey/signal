# Transport Panel Feature

## Purpose

Playback controls and position display.

## Entry Point

`TransportPanel` is the toolbar with the transport buttons, the tempo field, and the position display. The `useTransportPanel` hook supplies its state and actions.

## Responsibilities

- Play, stop, rewind, and fast-forward.
- Toggle loop, metronome, and recording.
- Show the current position. Edit the tempo.

## Design Notes

- Recording needs a connected MIDI input.
