<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: MIT
SPDX-License-Identifier: CC-BY-3.0
-->

# Validation Rules

CommitIt validates against the following sets of specifications:
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification)
- (OPTIONAL) [Extended Conventional Commits specification](#extended-conventional-commits-specification)

## Conventional Commits

| Identifier | Description |
| --- | --- |
| `CC-01` | Commits MUST be prefixed with a type, which consists of a noun, `feat`, `fix`, etc., followed by the OPTIONAL scope, OPTIONAL `!`, and REQUIRED terminal colon and space. | 
| `CC-04` | A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., `fix(parser):` |
| `CC-05` | A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., _fix: array parsing issue when multiple spaces were contained in string._ |
| `CC-06` | A longer commit body MAY be provided after the short description, providing additional contextual information about the code changes. The body MUST begin one blank line after the description. |

> **NOTE**: Above _3_ requirements are covered by _12_ distinct validation rules

## Extended Conventional Commits specification

| Identifier | Description |
| --- | --- |
| `EC-01` | A scope MAY be provided after a type. A scope MUST consist of one of the configured values (...) surrounded by parenthesis |
| `EC-02` | Commits MUST be prefixed with a type, which consists of one of the configured values (feat, fix, ...) |

You can provide the mentioned configuration options as follows:

```ts
const conventionalOptions = {
  // EC-01: A scope MAY be provided after a type. A scope MUST consist of one of the configured values (...) surrounded by parenthesis
  scopes: [ "core", "cli", "action" ],

  // EC-02: Commits MUST be prefixed with a type, which consists of one of the configured values (...)
  types: [ "build", "ci", "docs", "perf", "refactor", "style", "test" ],
}

const conventionalCommit = getConventionalCommit(gitCommit, conventionalOptions);
```
