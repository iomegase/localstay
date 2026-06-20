# Design — Gemini Markdown Visibility In Blog Editor

## Context

The approved blog editorial spec already allows Gemini to generate a Markdown draft and the admin editor already stores and applies that draft. The current UI only shows a compact summary (`title` + `excerpt`), which makes the generated Markdown hard to inspect before applying it.

This change stays inside spec `029-blog-editorial`, especially:

- the admin editor success state with a Gemini panel on `/admin/blog/new` and `/admin/blog/[id]`
- the requirement that the draft remains editable and separate from publication

## Goal

Make the Gemini draft Markdown visibly inspectable in the existing admin editor without changing the generation workflow, API route structure, or persistence model.

## Chosen Approach

Enhance the existing Gemini suggestion block in `AdminBlogEditor` by:

1. rendering a dedicated `Markdown Gemini` preview area using the existing generated payload
2. showing the draft in a large monospace, scrollable block
3. exposing a `Copier le Markdown` action alongside `Appliquer à l’article`
4. keeping the existing generation and apply flow unchanged

## Non-Goals

- no new API route
- no rewrite mode for existing article Markdown
- no automatic injection into the article body on generation
- no persistence change for grounded sources

## UI Notes

- the preview must remain readable on mobile
- the preview should visually separate metadata (`title`, `excerpt`) from raw Markdown
- copy feedback can be lightweight and local to the Gemini card

## Tests

- extend blog admin editor integration coverage to assert:
  - generated Markdown preview is visible
  - copy action is present
  - copy action writes the generated Markdown text

