/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { IConventionalCommitOptions } from "../src/conventional_commit";
import { Commit, ConventionalCommit } from "../src/index";

const removeColors = (message: string): string => {
  // eslint-disable-next-line no-control-regex
  return message.replace(/\x1b\[[0-9;]*m/g, "");
};

const validateRequirement = (message: string, expected: string, options?: IConventionalCommitOptions): void => {
  const commit = ConventionalCommit.fromString({ hash: "1234567890", message }, options);
  if (commit.isValid) {
    throw new Error(`Expected error message '${expected}', but no errors thrown.`);
  } else {
    let found = false;
    for (const err of commit.errors) {
      if (!found && removeColors(err.toString()).includes(expected)) found = true;
    }

    if (!found) {
      throw new Error(
        `Expected error message '${expected}' not found in: ${removeColors(
          commit.errors.map(e => e.message.text).join("\n")
        )}`
      );
    } else {
      commit.errors.forEach(e => console.log(e.toString()));
    }
  }
};

describe("Valid Conventional Commit subjects", () => {
  const tests = [
    { message: "feat: add new feature" },
    { message: "fix: fix bug" },
    { message: "fix!: fix bug with breaking change" },
    { message: "feat(login): add support google oauth (#12)" },
    { message: "FEAT: capitalized" },
  ];

  it.each(tests)("$message", test => {
    const options = { scopes: ["login"] };
    const commit = Commit.fromString({ hash: "01ab2cd3", message: test.message });
    expect(ConventionalCommit.fromCommit(commit, options).isValid).toBe(true);
  });
});

describe("Valid Conventional Commit subjects (unknown type)", () => {
  const tests = [{ message: "morning: add new feature" }, { message: "hippopotamus: fix bug" }];

  it.each(tests)("$message", test => {
    expect(() => {
      const commit = Commit.fromString({ hash: "01ab2cd3", message: test.message });
      expect(ConventionalCommit.fromCommit(commit).isValid).toBe(true);
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

describe("CC-06", () => {
  const tests = [
    { message: "feat: add new feature\nLine 1" },
    { message: "feat: add new feature\nLine 1\nLine 2" },
    { message: "feat: add new feature\nLine 1\n\nBody" },
  ];

  it.each(tests)("$message", test => {
    validateRequirement(test.message, "The body MUST begin one blank line after the description");
  });
});

describe("CC-15", () => {
  const tests = [
    { message: "feat: add new feature\n\nBreAking-ChaNGe: This is incorrectly formatted!" },
    { message: "feat: add new feature\n\nbreaking change: This is incorrectly formatted!" },
    { message: "feat: add new feature\n\nbreaking-change: This is incorrectly formatted!" },
  ];

  it.each(tests)("$message", test => {
    validateRequirement(
      test.message,
      "The units of information that make up Conventional Commits MUST NOT be treated as case sensitive by implementors, with the exception of BREAKING CHANGE which MUST be uppercase."
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

describe("WA-01", () => {
  const tests = [
    { message: "feat: add a new feature\n\nBREAKING CHANGE: this is a breaking change\n\nImplements #123" },
    { message: "feat: add a new feature\n\nBREAKING-CHANGE: this is a breaking change\n\nImplements #123" },
    {
      message:
        "feat: add a new feature\nwith a subject spanning multiple lines\n\nBREAKING-CHANGE: this is a breaking change\n\nImplements #123",
    },
    {
      message:
        "feat: add a new feature\nwith a subject spanning multiple lines\n\nLets add more lines in the body,\njust because we can\n\nco-authored-by: Bob the Builder\nBREAKING-CHANGE: this is a breaking change\n spanning two lines\n\nImplements #123!",
    },
  ];

  it.each(tests)("$message", test => {
    const commit = ConventionalCommit.fromString({ hash: "1234567890", message: test.message });
    expect(commit.warnings.length).toBe(1);
    expect(
      removeColors(commit.warnings[0].message.text).includes(
        "git-trailer has been found in the body of the commit message and will be ignored as it MUST be included in the footer."
      )
    ).toBe(true);
  });
});

describe("Breaking Change", () => {
  test("Has breaking change", () => {
    expect(
      ConventionalCommit.fromString({ hash: "01ab2cd3", message: "feat: add new feature with breaking change" })
        .breaking
    ).toBe(false);

    expect(
      ConventionalCommit.fromString({ hash: "01ab2cd3", message: "feat!: add new feature with breaking change" })
        .breaking
    ).toBe(true);

    expect(
      ConventionalCommit.fromString({
        hash: "01ab2cd3",
        message: `feat!: add new feature with breaking change in footer

BREAKING CHANGE: this is a breaking change`,
      }).breaking
    ).toBe(true);

    expect(
      ConventionalCommit.fromString({
        hash: "01ab2cd3",
        message: `feat: add new feature with breaking change in footer

BREAKING-CHANGE: this is a breaking change`,
      }).breaking
    ).toBe(true);
  });
});
