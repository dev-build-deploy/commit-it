/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import * as commit from "../src/commit";

describe("Valid singleline footer elements", () => {
  const tests = [
    { footers: undefined },
    { footers: { "co-authored-by": "Kevin de Jong" } },
    {
      footers: {
        "co-authored-by": "Kevin de Jong",
        "acknowledged-by": "Jane Doe",
      },
    },
    { footers: { "BREAKING CHANGE": "This is a breaking change" } },
    { footers: { "BREAKING-CHANGE": "This is a breaking change" } },
  ];

  it.each(tests)("$footers", test => {
    const commitMessage = commit.parseCommitMessage(`feat: example commit

${Object.entries(test.footers ?? {})
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}`);
    expect(commitMessage.footer).toStrictEqual(test.footers);
  });
});

describe("Valid multiline footer elements", () => {
  const tests = [
    {
      input: { "BREAKING CHANGE": "This is a breaking change\n covering multiple lines\n and not one, but two" },
      expectations: { "BREAKING CHANGE": "This is a breaking change\ncovering multiple lines\nand not one, but two" },
    },
    {
      input: { "BREAKING CHANGE": "This is a breaking change\n covering multiple lines\n \n including an empty line" },
      expectations: {
        "BREAKING CHANGE": "This is a breaking change\ncovering multiple lines\n\nincluding an empty line",
      },
    },
  ];

  it.each(tests)("$input", test => {
    const commitMessage = commit.parseCommitMessage(`feat: example commit

${Object.entries(test.input ?? {})
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}`);
    console.log(commitMessage);
    expect(commitMessage.footer).toStrictEqual(test.expectations);
  });
});

describe("Invalid Footer Elements", () => {
  const tests = [
    {
      message: `feat: invalid footer element

co authored by: Kevin de Jong`,
      footers: undefined,
    },
    {
      message: `feat: ignore footer element

acknowledged by: Jane Doe

This commit has been acknowledged, but a paragraph preceeds the footer`,
      footers: undefined,
    },
    {
      message: `feat: ignore footer element

BREAKING CHANGE: This is a multiline breaking change
in which we do not manage multiline correctly`,
      footers: undefined,
    },
    {
      message: `feat: Ignore initial footer element, but not the second

acknowledged by: Jane Doe

This commit has been acknowledged, but a paragraph preceeds the footer

BREAKING CHANGE: This is a breaking change`,
      footers: { "BREAKING CHANGE": "This is a breaking change" },
    },
  ];

  it.each(tests)("$footers", test => {
    const commitMessage = commit.parseCommitMessage(test.message);
    expect(commitMessage.footer).toStrictEqual(test.footers);
  });
});
