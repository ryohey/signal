# Cloud File Feature

## Purpose

Work with songs saved in the cloud.

## Entry Point

`CloudFileDialog` is the file browser. It lists the user's cloud songs in a sortable `CloudFileList` and opens the selected song. The `useCloudFile` hook runs the flows behind it, such as open, save, and publish.

## Responsibilities

- Open, save, save as, rename, and delete cloud songs.
- Import and export files. Publish songs.
- A sortable browser for the user's cloud songs.
- Progress, confirmation, and errors for each step.

## Design Notes

- Long operations confirm when needed and report progress.
- Cloud access uses the API package. This feature only runs the user flow.
