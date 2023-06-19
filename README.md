<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# CommitIt - Conventional Commits Library

Lightweight (Conventional) Commits library, allowing you to retrieve (Conventional) Commits and verify them agains the [Conventional Commits specification]

<img src="./docs/images/example.svg" width="100%">

## Features

* Simple to use
* Retrieving commit messages from your git objects or provided string
* Validate commit message against the [Conventional Commits] specification
* No additional dependencies (neither `git`, or other npm packages)

## Basic Usage

### Compliant Conventional Commits message
```ts
import { getCommit, getConventionalCommit } from '@dev-build-deploy/commit-it';

// Retrieve commit from your git objects database
const gitCommit = getCommit({ hash: "28609b79271821c451a21814bacf0807f1a5d0f9" });
const conventionalCommit = getConventionalCommit(gitCommit);

// NOTE: See "Non-compliant Conventional Commits message" for details on how to capture failures.

console.log(JSON.stringify(conventionalCommit, null, 2))
```
<details>
  <summary>Output...</summary>

```json
{
  "hash": "28609b79271821c451a21814bacf0807f1a5d0f9",
  "author": {
    "name": "Kevin de Jong <monkaii@hotmail.com>",
    "date": "2023-06-16T15:01:30.000Z"
  },
  "committer": {
    "name": "Kevin de Jong <134343960+Kevin-de-Jong@users.noreply.github.com>",
    "date": "2023-06-18T01:41:24.000Z"
  },
  "subject": "feat: add support to retrieve commits from a git source by SHA",
  "body": "This commit introduces custom parsing of the objects and pack files\nin .git/objects. Rationale: remove any need for external dependencies\n(albeit packages or tools).\n\nCalling `getCommitMessage(...)` will return a standard ICommit object",
  "type": "feat",
  "breaking": false,
  "description": "add support to retrieve commits from a git source by SHA"
}
```

</details>
<br>

### Non-compliant Conventional Commits message

```ts
import { getCommit, getConventionalCommit, ConventionalCommitError } from '@dev-build-deploy/commit-it';

// Provide a commit message as a string
const gitCommit = getCommit({
  hash: "0ab1cd2ef",
  message: "feat (no noun): non-compliant conventional commits message",
});

try {
  getConventionalCommit(gitCommit); // NOTE: this is an explicit failure
} catch (error: unknown) {
  if (!(error instanceof ConventionalCommitError)) throw error;

  error.errors.forEach(e => console.log(e.message));
}
```

<details>
  <summary>Output...</summary>
  <img src="./docs/images/example.svg" width="100%">
</details>
<br>

## Contributing

If you have suggestions for how commit-it could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [GPL-3.0-or-later AND CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>
- [CC-BY-3.0](LICENSE) © 2023 Free Software Foundation Europe e.V.
