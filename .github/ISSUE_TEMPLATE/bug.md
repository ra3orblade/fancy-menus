---
name: Bug report
about: A real bug — something is broken or doesn't match documented behavior.
labels: bug
---

### What happened

<!-- One clear sentence. -->

### What you expected

### Repro

<!--
A minimal MenuConfig that triggers the bug, plus the steps to reproduce.
The runnable form is best (a CodeSandbox or a Vite repo that imports
@fancy-menus/core), but a config snippet is enough if the bug is purely
in the schema → render path.
-->

```ts
import { defineMenu, BodyKind, RowKind, SourceKind } from '@fancy-menus/core';

const buggy = defineMenu({
	id: 'buggy',
	body: { kind: BodyKind.List, source: { kind: SourceKind.Static, items: [] }, rows: [] },
});
```

### Environment

- `@fancy-menus/core` version:
- React version:
- Browser:
- OS:

### Console output / stack trace
