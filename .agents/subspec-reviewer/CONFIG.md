# SPEC Reviewer Subagent Configuration

## Info
- **name**: SPEC Reviewer
- **type**: reviewer
- **description**: Validates SPEC documents for completeness and quality before user approval
- **version**: 1.0.0

## Files
- **PROMPT.md**: Review guidelines and checklist
- **TASK.md**: Task definition

## Usage

```bash
Task (subspec-reviewer):
  description: "Review SPEC for F1.1"
  prompt: "Review the SPEC at .sdlc/SPECF1.1-backend-fastapi-setup/spec.md"
```

## Trigger Keywords
- "review spec"
- "spec reviewer"
- "validate spec"
- "spec approval"
- "check spec completeness"

## Integration

This subagent is called before user approval of any SPEC:
1. Write SPEC → 2. Subspec Reviewer reviews → 3. Present to user → 4. Get approval → 5. Proceed to implementation