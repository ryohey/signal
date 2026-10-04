# firebaseui-web-react

## Purpose

A React component that hosts the FirebaseUI sign-in widget.

## Entry Point

`FirebaseAuthUI` takes a FirebaseUI config and an auth instance, and renders the sign-in widget in place.

## Responsibilities

- Mount and unmount the widget with React.
- Reuse one widget instance. Reset it on sign-out to drop stale sessions.

## Design Notes

- A thin layer between the widget's imperative lifecycle and React.
