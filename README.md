<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# CommitIt - Conventional Commits Library

Lightweight (Conventional) Commits library;

```json
{
  "hash": "0ab12cde",
  "author": {
    "name": "Jane Doe",
    "date": "2023-06-18T17:49:17.936Z"
  },
  "committer": {
    "name": "John Doe",
    "date": "2023-06-18T17:51:02.425Z"
  },
  "subject": "This is an example commit",
  "body": "Body of the commit",
  "footer": "Acknowledged-by: John Doe"
}
```

## Features

* Simple to use
* Retrieving commit messages from your git objects
* Convert a (full) commit message string
* No additional dependencies (neither `git`, or other npm packages)

## Usage

```ts
import { getCommit } from '@dev-build-deploy/commit-it';

// Retrieve commit from your git objects database
const commitA = getCommit({ hash: "0ab1c2d3.." })

// Use a string as input source
const commitB = getCommit({
  hash: "0ab1c2d3..",
  message: "This is an example commit message\n\nWith a nice body\n\nReviewed-by: Jane Doe",
  author: {     // OPTIONAL; author metadata
    name: "Kevin de Jong",
    date: new Date()
  },
  committer: {  // OPTIONAL; committer metadata
    name: "Kevin de Jong",
    date: new Date()
  }
  rootPath: "." // OPTIONAL; path containing your .git folder
})
```

## Contributing

If you have suggestions for how commit-it could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [GPL-3.0-or-later, CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>
