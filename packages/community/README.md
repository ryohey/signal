# @signal-app/community

## Purpose

The community web app: share, browse, and play songs, and manage user profiles.

## Entry Point

`RootStore` is the composition root. It creates the API repositories, the stores for songs, auth, and views, and a `Player` connected to a SoundFont synthesizer. Pages reach everything through it.

## Responsibilities

- Pages for the home feed, songs, and users, including profile editing.
- Playback of published songs, with previous and next.
- Sign-in flows and account state.

## Design Notes

- Pages render. Stores own app state and side effects.
- Cloud access and playback come from the shared API and player packages, not from UI code.

## Boundaries

- Separate from the sequencer app. Shares packages, not UI state.
