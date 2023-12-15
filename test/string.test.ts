/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { Commit } from "../src/index";

describe("Parse commit messages", () => {
  test("Author", () => {
    expect(
      Commit.fromString({
        hash: "0a0b0c0d",
        author: { name: "Jane Doe", date: new Date("2023-06-16T14:28:58.000Z") },
        message: "Example commit message without body or footer",
      })
    ).toEqual({
      _commit: {
        raw: `Example commit message without body or footer`,
        hash: "0a0b0c0d",
        author: {
          name: "Jane Doe",
          date: new Date("2023-06-16T14:28:58.000Z"),
        },
        committer: undefined,
        subject: "Example commit message without body or footer",
        body: undefined,
        footer: undefined,
      },
    });
  });

  test("Committer", () => {
    expect(
      Commit.fromString({
        hash: "0a0b0c0d",
        committer: { name: "Jane Doe", date: new Date("2023-06-16T14:28:58.000Z") },
        message: "Example commit message without body or footer",
      })
    ).toEqual({
      _commit: {
        raw: `Example commit message without body or footer`,
        hash: "0a0b0c0d",
        author: undefined,
        committer: {
          name: "Jane Doe",
          date: new Date("2023-06-16T14:28:58.000Z"),
        },
        subject: "Example commit message without body or footer",
        body: undefined,
        footer: undefined,
      },
    });
  });

  test("Subject only", () => {
    expect(Commit.fromString({ hash: "0a0b0c0d", message: "Example commit message without body or footer" })).toEqual({
      _commit: {
        raw: `Example commit message without body or footer`,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message without body or footer",
        body: undefined,
        footer: undefined,
      },
    });

    expect(
      Commit.fromString({ hash: "0a0b0c0d", message: `Example commit message without body or footer, with newline\n` })
    ).toEqual({
      _commit: {
        raw: `Example commit message without body or footer, with newline\n`,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message without body or footer, with newline",
        body: undefined,
        footer: undefined,
      },
    });

    expect(
      Commit.fromString({
        hash: "0a0b0c0d",
        message: `Example commit message without body or footer, with newlines\n\n`,
      })
    ).toEqual({
      _commit: {
        raw: `Example commit message without body or footer, with newlines\n\n`,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message without body or footer, with newlines",
        body: undefined,
        footer: undefined,
      },
    });
  });

  test("Subject and body", () => {
    const singleBody = `Example commit message with body

This is the body of the commit message`;
    const multiBody = `Example commit message with body

This is the body of the commit message
with multiple lines

and paragraphs`;
    expect(Commit.fromString({ hash: "0a0b0c0d", message: singleBody })).toEqual({
      _commit: {
        raw: singleBody,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message with body",
        body: "This is the body of the commit message",
        footer: undefined,
      },
    });

    expect(Commit.fromString({ hash: "0a0b0c0d", message: multiBody })).toEqual({
      _commit: {
        raw: multiBody,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message with body",
        body: `This is the body of the commit message\nwith multiple lines\n\nand paragraphs`,
        footer: undefined,
      },
    });
  });

  test("Subject and footer", () => {
    const singleFooter = `Example commit message with footer

Acknowledged-by: Jane Doe`;
    const multiFooter = `Example commit message with footer

Acknowledged-by: Jane Doe
Signed-off-by: John Doe`;
    const paragraphFooter = `Example commit message with footer

Acknowledged-by: Jane Doe
Signed-off-by: John Doe
BREAKING-CHANGE: This is a breaking change
 using multiple lines as value`;

    expect(Commit.fromString({ hash: "0a0b0c0d", message: singleFooter })).toEqual({
      _commit: {
        raw: singleFooter,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message with footer",
        body: undefined,
        footer: {
          "Acknowledged-by": "Jane Doe",
        },
      },
    });

    expect(Commit.fromString({ hash: "0a0b0c0d", message: multiFooter })).toEqual({
      _commit: {
        raw: multiFooter,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message with footer",
        body: undefined,
        footer: {
          "Acknowledged-by": "Jane Doe",
          "Signed-off-by": "John Doe",
        },
      },
    });

    expect(Commit.fromString({ hash: "0a0b0c0d", message: paragraphFooter })).toEqual({
      _commit: {
        raw: paragraphFooter,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message with footer",
        body: undefined,
        footer: {
          "Acknowledged-by": "Jane Doe",
          "Signed-off-by": "John Doe",
          "BREAKING-CHANGE": "This is a breaking change\nusing multiple lines as value",
        },
      },
    });
  });

  test("Subject, body, and footer", () => {
    const fullCommit = `Example commit message with footer

This is the body of the commit message
with multiple lines

and: paragraphs as well

Acknowledged-by: Jane Doe
Signed-off-by: John Doe
BREAKING-CHANGE: This is a breaking change
 using multiple lines as value
Implements #1234`;

    expect(Commit.fromString({ hash: "0a0b0c0d", message: fullCommit })).toEqual({
      _commit: {
        raw: fullCommit,
        hash: "0a0b0c0d",
        author: undefined,
        committer: undefined,
        subject: "Example commit message with footer",
        body: "This is the body of the commit message\nwith multiple lines\n\nand: paragraphs as well",
        footer: {
          "Acknowledged-by": "Jane Doe",
          "Signed-off-by": "John Doe",
          "BREAKING-CHANGE": "This is a breaking change\nusing multiple lines as value",
          Implements: "#1234",
        },
      },
    });
  });
});
