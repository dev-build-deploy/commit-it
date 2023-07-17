/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import * as commitIt from "../src/index";
import { ICommit } from "../src/commit";
import { IConventionalCommitOptions } from "../src/conventional_commit";

const removeColors = (message: string) => {
  // eslint-disable-next-line no-control-regex
  return message.replace(/\x1b\[[0-9;]*m/g, "");
};

const validateRequirement = (message: string, expected: string, options?: IConventionalCommitOptions) => {
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
          error.errors.map(e => e.message).join("\n")
        )}`
      );
    }
  }
};

/**
 * Validates that the commit message is a valid conventional commit.
 */
describe("Conventional Commits specification", () => {
  test("Valid Conventional Commit subjects", () => {
    for (const subject of [
      "feat: add new feature",
      "fix: fix bug",
      "fix!: fix bug with breaking change",
      "docs: update documentation",
      "style: update style",
      "style(format): update style with scope",
      "refactor: refactor code",
      "test: update tests",
      "test(unit)!: update unit tests which leads to a breaking change",
      "chore: update build scripts",
    ]) {
      expect(() => {
        const commit = commitIt.getCommit({ hash: "01ab2cd3", message: subject });
        expect(commitIt.isConventionalCommit(commit)).toBe(false);
        expect(commitIt.isConventionalCommit(commitIt.getConventionalCommit(commit))).toBe(true);
      }).not.toThrow();
    }
  });

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

  test("CC-01", () => {
    for (const message of [
      "(scope): missing type",
      ": missing type",
      "!: missing type",
      " !: missing type",
      "feat foot(scope)!: whatabout a noun",
      "feat123(scope)!: numbers arent nouns",
      "feat?#(scope): special characters arent nouns",
      "feat missing semicolon",
      "feat:missing space after semicolon",
      "feat : space before semicolon",
      "feat:   too many spaces after semicolon",
      "feat (scope): space between type and scope",
      "feat(scope) : space between scope and semicolon",
      "feat !: space between type and breaking change",
      "feat! : space between breaking change and semicolon",
      "feat foot (scope) ! :incorrect spaces everywhere",
    ]) {
      validateRequirement(
        message,
        "Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space."
      );
    }
  });

  test("CC-04", () => {
    for (const message of [
      "feat(): empty scope",
      "feat(a noun): scope with spacing",
      "feat(1234): numbers arent nouns",
      "feat(?!): special characters arent nouns",
      "feat (?!) : special characters arent nouns",
    ]) {
      validateRequirement(
        message,
        "A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., fix(parser):"
      );
    }
  });

  test("CC-05", () => {
    for (const message of ["feat:", "feat: ", "feat:    ", "feat:   too many spaces after terminal colon"]) {
      validateRequirement(
        message,
        "A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., fix: array parsing issue when multiple spaces were contained in string."
      );
    }
  });
});

describe("Extended Conventional Commits specification", () => {
  test("EC-01", () => {
    for (const message of ["feat(wrong): unknown scope"]) {
      validateRequirement(
        message,
        "A scope MAY be provided after a type. A scope MUST consist of one of the configured values (action, cli) surrounded by parenthesis",
        {
          scopes: ["action", "cli"],
        }
      );
    }
  });

  test("EC-02", () => {
    for (const message of ["chore: unknown type", "docs(scope)!: unknown type"]) {
      validateRequirement(
        message,
        "Commits MUST be prefixed with a type, which consists of one of the configured values (feat, fix, build, perf)",
        {
          types: ["build", "perf"],
        }
      );
    }
  });
});
