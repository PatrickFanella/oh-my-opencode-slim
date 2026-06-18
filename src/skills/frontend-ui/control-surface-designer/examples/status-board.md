# Example Status Board Hierarchy

```text
Delegated work
  exp-1  explorer     running      searching src/hooks
  fix-1  fixer        waiting      permission requested
  ora-1  oracle       completed    review available

Needs attention
  fix-1 is waiting for user input
  exp-2 status is unknown after session deletion

Safe actions
  cancel_task fix-1
  read completed ora-1 result
```
