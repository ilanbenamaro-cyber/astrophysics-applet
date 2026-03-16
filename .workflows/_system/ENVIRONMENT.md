# Environment Configuration
# _system/ENVIRONMENT.md
#
# READ AT THE START OF EVERY SESSION.
# This file governs what actions are safe in the current environment.
# When in doubt, treat as the most restrictive environment that applies.

---

## Current Environment

```
ENVIRONMENT: development
```

<!-- Options: development | staging | production -->
<!-- Update this field manually when switching environments -->

---

## Permission Matrix

### development
```
Read files:           ✓ unrestricted
Write files:          ✓ unrestricted (except absolute constraints in CLAUDE.md)
Execute commands:     ✓ unrestricted
Create branches:      ✓ unrestricted
Commit:               ✓ unrestricted
Delete files:         ✓ with explicit instruction only
Force operations:     ✗ never
```

### staging
```
Read files:           ✓ unrestricted
Write files:          ✓ allowed — pause before writing config files
Execute commands:     ✓ read-only commands only (no side effects)
Create branches:      ✓ allowed
Commit:               ✓ allowed
Delete files:         ✗ never without explicit user confirmation
Force operations:     ✗ never
Schema changes:       ✗ escalate to user — do not execute
```

### production
```
Read files:           ✓ allowed for diagnosis
Write files:          ✗ STOP — confirm with user before any write
Execute commands:     ✗ STOP — confirm with user before any execution
Commit:               ✗ not from production environment
Delete files:         ✗ never
Force operations:     ✗ never
ANY CHANGE:           Pause. State what you want to do. Wait for explicit approval.
```

---

## Environment-Specific Gotchas

<!-- Add entries as they are discovered -->
<!-- Format: [ENV] [area] — description — date -->

---

## Switching Environments

When the user indicates a context switch (e.g., "we're deploying", "this is prod"):
1. Update the ENVIRONMENT field above
2. Re-read the permission matrix for the new environment
3. Acknowledge the switch in your next response
4. Apply the new constraints immediately
