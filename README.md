<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# CommitIt - Conventional Commits Library

Lightweight (Conventional) Commits library, allowing you to retrieve (Conventional) Commits and verify them against the [(Extended) Conventional Commits specification]

<img src="./docs/images/example.svg" width="100%">

## Features

* Simple to use
* Retrieving commit messages from your git objects or provided string
* Validate the commit message against the [(Extended) Conventional Commits specification]

## Basic Usage

### Commit Message
```ts
import { Commit } from "@dev-build-deploy/commit-it";

const gitCommit = Commit.fromHash({ hash: "f1aaa6e0b89eb87b591ab623053845b5d5488d9f" });
console.log(JSON.stringify(gitCommit, null, 2))
```

### Conventional Commit message (compliant)
```ts
import { ConventionalCommit } from '@dev-build-deploy/commit-it';

// OPTIONAL; Conventional Commits options
const conventionalOptions = {
  // EC-01: A scope MAY be provided after a type. A scope MUST consist of one of the configured values (...) surrounded by parenthesis
  scopes: [ "core", "cli", "action" ],

  // EC-02: Commits MUST be prefixed with a type, which consists of one of the configured values (feat, fix, ...)
  types: [ "build", "ci", "docs", "perf", "refactor", "style", "test" ],
};

const conventionalCommit = ConventionalCommit.fromHash(
  { hash: "f1aaa6e0b89eb87b591ab623053845b5d5488d9f" },
  conventionalOptions
);

// NOTE: See "Non-compliant Conventional Commits message" for details on how to capture failures.
console.log(JSON.stringify(conventionalCommit, null, 2));
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
  "description": "mark Conventional Commit as 'breaking' in case specified in the footer",
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

</details>
<br>

### Conventional Commit message (non-compliant)

```ts
import { ConventionalCommit } from '@dev-build-deploy/commit-it';

// Provide a commit message as a string
const conventionalCommit = ConventionalCommit.fromString({
  hash: "0ab1cd2ef",
  message: "feat (no noun): non-compliant conventional commits message",
});

if (!conventionalCommit.isValid) {
  conventionalCommit.errors.forEach(e => console.log(e.toString()));
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

- [MIT](./LICENSES/MIT.txt) © 2023 Kevin de Jong \<monkaii@hotmail.com\>
- [CC-BY-3.0](./LICENSES/CC-BY-3.0.txt) © 2023 Free Software Foundation Europe e.V.

[(Extended) Conventional Commits specification]: ./docs/rules.md