---
node_id: AI-IMP-146
tags:
  - IMP-LIST
  - Implementation
  - ux
  - settings
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.7
date_created: 2026-03-19
date_completed: 2026-04-28
---

# AI-IMP-146-settings-phrasing-review

## Review settings phrasings for new views

Settings labels, tooltips, and descriptions were written before batch view and the expanded media bucket existed. Some phrasings may be confusing or inaccurate in the multi-view context (e.g., "Number of clusters" implying a single image, export directory labels, parameter descriptions).

### Out of Scope

- Adding new settings.
- Changing settings behavior or defaults.
- Redesigning the settings layout.

### Design/Approach

Audit all text in SettingsView.svelte and ParameterControls.svelte. Cross-reference with the current feature set (batch analysis, independent batch params, video input, multi-image library). Update any labels that are misleading or incomplete. Keep changes minimal — this is copy editing, not redesign.

### Files to Touch

- `src/lib/views/SettingsView.svelte`: label/description text
- `src/lib/views/home/ParameterControls.svelte`: tooltip text

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Audit all labels in SettingsView
- [ ] Audit all tooltips in ParameterControls
- [ ] Update any misleading or incomplete text
- [ ] `npm run check && npm run lint`
- [ ] Manual review: all settings text makes sense in multi-view context

### Acceptance Criteria

**Scenario:** Settings text is accurate
**GIVEN** the user opens Settings view.
**THEN** all labels and descriptions accurately reflect the app's current capabilities.
**AND** no text implies single-image-only behavior when batch is supported.

### Issues Encountered

<!--
This section is filled out post work.
-->
