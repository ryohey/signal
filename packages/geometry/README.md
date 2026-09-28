# @signal-app/geometry

## Purpose

Basic geometry shared across Signal: points, sizes, and rectangles.

## Entry Point

`Rect` is a plain `{ x, y, width, height }` value with a namespace of pure helpers, such as `Rect.containsPoint`, `Rect.intersects`, and `Rect.fromPoints`. `Point` has its own helpers, such as `Point.add`. `Size` is a plain value.

## Responsibilities

- Plain value types for positions and areas.
- Pure helpers for containment, intersection, and construction.

## Boundaries

- Generic. No knowledge of music, events, or UI frameworks.
