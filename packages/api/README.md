# @signal-app/api

## Purpose

Client access to the cloud backend: cloud songs, song data, MIDI import, and user profiles.

## Entry Point

`ICloudSongRepository` is the typical repository. `createCloudSongRepository` builds one from the backend clients. It creates, updates, deletes, publishes, and lists cloud songs, and returns plain song objects. The other repositories follow the same interface-plus-factory shape.

## Responsibilities

- Repositories for cloud songs, song data, MIDI import, and users.
- Conversion between backend storage format and plain domain values. Callers never handle backend-specific types.
- Consistent multi-step writes.
- The signed-in user and its changes.

## Design Notes

- Callers depend on repository interfaces, not implementations. The backend can change without affecting them.
- Operations that need a signed-in user fail explicitly without one.

## Boundaries

- No UI and no app state. Consumers decide when to call and how to show results.
