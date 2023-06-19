<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# CommitIt - Conventional Commits Library

Lightweight (Conventional) Commits library, allowing you to retrieve (Conventional) Commits and verify them against the [Conventional Commits specification]

<img src="./docs/images/example.svg" width="100%">

## Features

* Simple to use
* Retrieving commit messages from your git objects or provided string
* Validate the commit message against the [Conventional Commits specification]

## Basic Usage

### Compliant Conventional Commits message
```ts
import { getCommit, getConventionalCommit } from '@dev-build-deploy/commit-it';

// Retrieve commit from your git objects database
const gitCommit = getCommit({ hash: "f1aaa6e0b89eb87b591ab623053845b5d5488d9f" });
const conventionalCommit = getConventionalCommit(gitCommit);

// NOTE: See "Non-compliant Conventional Commits message" for details on how to capture failures.

console.log(JSON.stringify(conventionalCommit, null, 2))
```
<details>
  <summary>Output...</summary>

```json
{
  "hash": "f1aaa6e0b89eb87b591ab623053845b5d5488d9f",
  "author": {
    "name": "Kevin de Jong <monkaii@hotmail.com>",
    "date": "2023-06-19T04:20:03.000Z"
  },
  "committer": {
    "name": "Kevin de Jong <monkaii@hotmail.com>",
    "date": "2023-06-19T04:20:03.000Z"
  },
  "subject": "feat: mark Conventional Commit as 'breaking' in case specified in the footer",
  "body": "A Conventional Commit must be marked as a BREAKING change when:\n- An exlamantion mark (`!`) is used in the subject\n- The footer contains either `BREAKING-CHANGE: xyz` or `BREAKING CHANGE: xyz`\n\nThis commit adds the second use case.",
  "footer": {
    "Implements": "#6"
  },
  "type": "feat",
  "breaking": false,
  "description": "mark Conventional Commit as 'breaking' in case specified in the footer"
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

[Conventional Commits specification]: https://www.conventionalcommits.org/en/v1.0.0/