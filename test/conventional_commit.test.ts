/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import { ICommit } from "../src/commit";
import { IConventionalCommitOptions } from "../src/conventional_commit";
import * as commitIt from "../src/index";

const removeColors = (message: string): string => {
  // eslint-disable-next-line no-control-regex
  return message.replace(/\x1b\[[0-9;]*m/g, "");
};

const validateRequirement = (message: string, expected: string, options?: IConventionalCommitOptions): void => {
  const msg = {
    hash: "1234567890",
    message: message,
  };

  let commit: ICommit = commitIt.getCommit(msg);
  try {
    commit = commitIt.getConventionalCommit(commit, options);
    throw new Error(`Expected error message '${expected}', but no errors thrown.`);
  } catch (error: unknown) {
    if (!(error instanceof commitIt.ConventionalCommitError)) throw error;
    expect(commitIt.isConventionalCommit(commit)).toBe(false);

    let found = false;
    for (const err of error.errors) {
      if (!found && removeColors(err.toString()).includes(expected)) found = true;
    }
    if (!found) {
      throw new Error(
        `Expected error message '${expected}' not found in: ${removeColors(
          error.errors.map(e => e.message.text).join("\n")
        )}`
      );
    } else {
      error.errors.forEach(e => console.log(e.toString()));
    }
  }
};

describe("Valid Conventional Commit subjects", () => {
  const tests = [
    { message: "feat: add new feature" },
    { message: "fix: fix bug" },
    { message: "fix!: fix bug with breaking change" },
    { message: "feat(login): add support google oauth (#12)" },
  ];

  it.each(tests)("$message", test => {
    expect(() => {
      const commit = commitIt.getCommit({ hash: "01ab2cd3", message: test.message });
      expect(commitIt.isConventionalCommit(commit)).toBe(false);
      expect(
        commitIt.isConventionalCommit(
          commitIt.getConventionalCommit(commit, {
            scopes: ["login"],
          })
        )
      ).toBe(true);
    }).not.toThrow();
  });
});

describe("CC-01", () => {
  const tests = [
    { message: "feat : additional space" },
    { message: "feat foot(scope)!: whatabout a noun" },
    { message: "feat123(scope)!: numbers arent nouns" },
    { message: "feat?#(scope): special characters arent nouns" },
    { message: "feat missing semicolon" },
    { message: "feat (scope): space between type and scope" },
    { message: "feat(scope) : space between scope and semicolon" },
    { message: "feat !: space between type and breaking change" },
    { message: "feat! : space between breaking change and semicolon" },
    { message: "feat foot (scope) ! :incorrect spaces everywhere" },
    { message: "feat  foot  (scope) ! :   incorrect spaces everywhere, part Deux" },
  ];

  it.each(tests)("$message", test => {
    validateRequirement(
      test.message,
      "Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space."
    );
  });
});

describe("CC-04", () => {
  const tests = [
    { message: "feat(): empty scope" },
    { message: "feat(a noun): scope with spacing" },
    { message: "feat(1234): numbers arent nouns" },
    { message: "feat(?!): special characters arent nouns" },
    { message: "feat (?!) : special characters arent nouns" },
  ];

  it.each(tests)("$message", test => {
    validateRequirement(
      test.message,
      "A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., fix(parser):"
    );
  });
});

describe("CC-05", () => {
  const tests = [
    { message: "feat:" },
    { message: "feat: " },
    { message: "feat:    " },
    { message: "feat:   too many spaces after terminal colon" },
    { message: "feat:missing space after semicolon" },
    { message: "feat foot (scope) ! :incorrect spaces everywhere" },
  ];

  it.each(tests)("$message", test => {
    validateRequirement(
      test.message,
      "A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., fix: array parsing issue when multiple spaces were contained in string."
    );
  });
});

describe("EC-01", () => {
  const tests = [
    { message: "feat(wrong): unknown scope" },
    { message: "feat (wrong): spacing as prefix" },
    { message: "feat(wrong) : spacing as suffix" },
    { message: "feat ( wrong ) : spacing everywhere" },
  ];

  it.each(tests)("$message", test => {
    validateRequirement(
      test.message,
      "A scope MAY be provided after a type. A scope MUST consist of one of the configured values (action, cli) surrounded by parenthesis",
      {
        scopes: ["action", "action", "cli", "cli"],
      }
    );
  });
});

describe("EC-02", () => {
  const tests = [
    { message: "chore: unknown type" },
    { message: "docs(scope)!: unknown type" },
    { message: "(scope): missing type" },
    { message: ": missing type" },
    { message: "!: missing type" },
    { message: " !: missing type" },
  ];

  it.each(tests)("$message", test => {
    validateRequirement(
      test.message,
      "Commits MUST be prefixed with a type, which consists of one of the configured values (feat, fix, build, perf)",
      {
        scopes: ["scope"],
        types: ["feat", "build", "build", "perf", "perf", "fix"],
      }
    );
  });
});

describe("Breaking Change", () => {
  test("Has breaking change", () => {
    expect(
      commitIt.getConventionalCommit({
        hash: "01ab2cd3",
        subject: "feat: add new feature without breaking change",
      }).breaking
    ).toBe(false);

    expect(
      commitIt.getConventionalCommit({
        hash: "01ab2cd3",
        subject: "feat!: add new feature with breaking change",
      }).breaking
    ).toBe(true);

    expect(
      commitIt.getConventionalCommit({
        hash: "01ab2cd3",
        subject: "feat: add new feature with breaking change in footer",
        footer: {
          "BREAKING CHANGE": "this is a breaking change",
        },
      }).breaking
    ).toBe(true);

    expect(
      commitIt.getConventionalCommit({
        hash: "01ab2cd3",
        subject: "feat: add new feature with breaking change in footer",
        footer: {
          "BREAKING-CHANGE": "this is a breaking change",
        },
      }).breaking
    ).toBe(true);
  });
});
