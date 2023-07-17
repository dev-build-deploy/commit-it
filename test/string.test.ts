/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import * as commitIt from "../src/index";

describe("Parse commit messages", () => {
  test("Author", () => {
    expect(
      commitIt.getCommit({
        hash: "0a0b0c0d",
        author: { name: "Jane Doe", date: new Date("2023-06-16T14:28:58.000Z") },
        message: "Example commit message without body or footer",
      })
    ).toStrictEqual({
      hash: "0a0b0c0d",
      author: {
        name: "Jane Doe",
        date: new Date("2023-06-16T14:28:58.000Z"),
      },
      committer: undefined,
      subject: "Example commit message without body or footer",
      body: undefined,
      footer: undefined,
    });
  });

  test("Committer", () => {
    expect(
      commitIt.getCommit({
        hash: "0a0b0c0d",
        committer: { name: "Jane Doe", date: new Date("2023-06-16T14:28:58.000Z") },
        message: "Example commit message without body or footer",
      })
    ).toStrictEqual({
      hash: "0a0b0c0d",
      author: undefined,
      committer: {
        name: "Jane Doe",
        date: new Date("2023-06-16T14:28:58.000Z"),
      },
      subject: "Example commit message without body or footer",
      body: undefined,
      footer: undefined,
    });
  });

  test("Subject only", () => {
    expect(
      commitIt.getCommit({ hash: "0a0b0c0d", message: "Example commit message without body or footer" })
    ).toStrictEqual({
      hash: "0a0b0c0d",
      author: undefined,
      committer: undefined,
      subject: "Example commit message without body or footer",
      body: undefined,
      footer: undefined,
    });

    expect(
      commitIt.getCommit({ hash: "0a0b0c0d", message: `Example commit message without body or footer, with newline\n` })
    ).toStrictEqual({
      hash: "0a0b0c0d",
      author: undefined,
      committer: undefined,
      subject: "Example commit message without body or footer, with newline",
      body: undefined,
      footer: undefined,
    });

    expect(
      commitIt.getCommit({
        hash: "0a0b0c0d",
        message: `Example commit message without body or footer, with newlines\n\n`,
      })
    ).toStrictEqual({
      hash: "0a0b0c0d",
      author: undefined,
      committer: undefined,
      subject: "Example commit message without body or footer, with newlines",
      body: undefined,
      footer: undefined,
    });
  });

  test("Subject and body", () => {
    const singleBody = `Example commit message with body

This is the body of the commit message`;
    const multiBody = `Example commit message with body

This is the body of the commit message
with multiple lines

and paragraphs`;
    expect(commitIt.getCommit({ hash: "0a0b0c0d", message: singleBody })).toStrictEqual({
      hash: "0a0b0c0d",
      author: undefined,
      committer: undefined,
      subject: "Example commit message with body",
      body: "This is the body of the commit message",
      footer: undefined,
    });

    expect(commitIt.getCommit({ hash: "0a0b0c0d", message: multiBody })).toStrictEqual({
      hash: "0a0b0c0d",
      author: undefined,
      committer: undefined,
      subject: "Example commit message with body",
      body: `This is the body of the commit message\nwith multiple lines\n\nand paragraphs`,
      footer: undefined,
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

    expect(commitIt.getCommit({ hash: "0a0b0c0d", message: singleFooter })).toStrictEqual({
      hash: "0a0b0c0d",
      author: undefined,
      committer: undefined,
      subject: "Example commit message with footer",
      body: undefined,
      footer: {
        "Acknowledged-by": "Jane Doe",
      },
    });

    expect(commitIt.getCommit({ hash: "0a0b0c0d", message: multiFooter })).toStrictEqual({
      hash: "0a0b0c0d",
      author: undefined,
      committer: undefined,
      subject: "Example commit message with footer",
      body: undefined,
      footer: {
        "Acknowledged-by": "Jane Doe",
        "Signed-off-by": "John Doe",
      },
    });

    expect(commitIt.getCommit({ hash: "0a0b0c0d", message: paragraphFooter })).toStrictEqual({
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

    expect(commitIt.getCommit({ hash: "0a0b0c0d", message: fullCommit })).toStrictEqual({
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
    });
  });
});
