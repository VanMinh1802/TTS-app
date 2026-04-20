# SPEC Reviewer Task

## Task
Review a SPEC document for completeness and quality.

## Usage
User will provide a SPEC file path. Review it using the PROMPT.md checklist.

## Example Invocation

```
Task (subspec-reviewer):
  description: "Review SPEC for F1.1"
  prompt: |
    Please review the SPEC at .sdlc/SPECF1.1-backend-fastapi-setup/spec.md
    Use the checklist in PROMPT.md to validate it.
    
    Output your review in the format specified in PROMPT.md.
```

## Output
- Review summary with Pass/Fail
- Issues found (with severity levels)
- Questions for user
- Recommendation (APPROVE / REJECT / CLARIFY)