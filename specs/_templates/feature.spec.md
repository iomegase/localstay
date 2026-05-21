# Feature Spec Template

> Copy this file to `specs/features/NNN-feature-name/spec.md` and fill every section.
> No section may remain `TODO` before moving to `review` status.

---

## Metadata

```yaml
id: NNN-feature-name
title: "Feature Title"
status: draft                  # draft | review | approved | implemented | deprecated
mvp: 1                         # 1 | 2 | 3 | 4
owner: ""                      # product owner name
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
depends_on: []                 # list of spec IDs this feature depends on
```

---

## Context

> Why does this feature exist? What problem does it solve?
> Link to user research, business goal, or MVP objective.

---

## Glossary References

> List terms from `specs/glossary.md` used in this spec.

- **Term**: definition reminder

---

## User Stories

### US-01 — Title

**As a** [role]
**I want to** [action]
**So that** [benefit]

#### Acceptance Criteria

- **AC-01-01**: Given [...] When [...] Then [...]
- **AC-01-02**: Given [...] When [...] Then [...]

---

### US-02 — Title

**As a** [role]
**I want to** [action]
**So that** [benefit]

#### Acceptance Criteria

- **AC-02-01**: Given [...] When [...] Then [...]

---

## Business Rules

> Explicit constraints the code must enforce. Each rule must be unambiguous.

- **BR-01**: [Rule description]
- **BR-02**: [Rule description]

---

## Data Model

> Prisma schema fragment. Only the models introduced or modified by this feature.

```prisma
model ExampleModel {
  id         String   @id @default(uuid())
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  deleted_at DateTime?

  // feature-specific fields here
}
```

---

## API Contract

> OpenAPI 3.1 fragment. Every route this feature exposes or consumes.

```yaml
paths:
  /api/example:
    get:
      summary: "Example endpoint"
      tags: [feature-name]
      parameters:
        - name: param
          in: query
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
        "400":
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "500":
          description: Internal Server Error

components:
  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
```

---

## UI Behaviour

> Describe component states, interactions, loading states, empty states, error states.
> Reference Shadcn/ui components where applicable.

### Page / Component: [Name]

- **Loading state**: [description]
- **Empty state**: [description]
- **Error state**: [description]
- **Success state**: [description]
- **Mobile behaviour**: [description]

---

## Acceptance Criteria Summary

> Full list for test generation. Maps 1:1 to tests in `tests/`.

| ID | Description | Test type | Test file |
|---|---|---|---|
| AC-01-01 | [description] | unit | `tests/unit/...` |
| AC-01-02 | [description] | integration | `tests/integration/...` |
| AC-02-01 | [description] | e2e | `tests/e2e/...` |

---

## Out of Scope

> What is explicitly NOT part of this feature. Prevents scope creep.

- [Item not included]
- [Item not included]

---

## Open Questions

> Unresolved items. Must all be resolved before status → `approved`.

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | [question] | [name] | [date] | pending |
