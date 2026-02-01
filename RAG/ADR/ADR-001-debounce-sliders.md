---
node_id:
tags:
  -
status: draft
depends_on:
created_date: {{date}}
last_modified: {{date}}
related_files: []
---

# ADR-001-debounce-sliders

## Objective
<!-- A concise statement explaining the goal of this decision. -->
Moving the sliders is responsive and does not cause ui lag

## Context
<!-- What is the issue that we're seeing that is motivating this decision or change? -->
Every time the sliders move the algo will trigger k-means number crunching. if this is an issue we can debounce the event.

## Decision
<!-- What is the change that we're proposing and or doing? -->
Monitor and in the likely event it's not performant we will debounce the event. If it's fast enough to be a live preview that's ideal.

## Consequences
<!-- What becomes easier or more difficult to do because of this change? -->
Pending

## Updates
<!-- Changes that happened when the rubber met the road -->
