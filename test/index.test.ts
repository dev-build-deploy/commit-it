/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as index from "../src/index";

describe("Parse commit messages", () => {
  test("Subject only", () => {
    expect(index.parseCommitMessage("Example commit message without body or footer")).toStrictEqual({
      subject: "Example commit message without body or footer",
      body: undefined,
      footer: undefined,
    });

    expect(
      index.parseCommitMessage(`Example commit message without body or footer, with newline
`)
    ).toStrictEqual({
      subject: "Example commit message without body or footer, with newline",
      body: undefined,
      footer: undefined,
    });

    expect(
      index.parseCommitMessage(`Example commit message without body or footer, with newlines

`)
    ).toStrictEqual({
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
    expect(index.parseCommitMessage(singleBody)).toStrictEqual({
      subject: "Example commit message with body",
      body: "This is the body of the commit message",
      footer: undefined,
    });

    expect(index.parseCommitMessage(multiBody)).toStrictEqual({
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

    expect(index.parseCommitMessage(singleFooter)).toStrictEqual({
      subject: "Example commit message with footer",
      body: undefined,
      footer: "Acknowledged-by: Jane Doe",
    });

    expect(index.parseCommitMessage(multiFooter)).toStrictEqual({
      subject: "Example commit message with footer",
      body: undefined,
      footer: "Acknowledged-by: Jane Doe\nSigned-off-by: John Doe",
    });

    expect(index.parseCommitMessage(paragraphFooter)).toStrictEqual({
      subject: "Example commit message with footer",
      body: undefined,
      footer:
        "Acknowledged-by: Jane Doe\nSigned-off-by: John Doe\nBREAKING-CHANGE: This is a breaking change\n using multiple lines as value",
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
 using multiple lines as value`;

    expect(index.parseCommitMessage(fullCommit)).toStrictEqual({
      subject: "Example commit message with footer",
      body: "This is the body of the commit message\nwith multiple lines\n\nand: paragraphs as well",
      footer:
        "Acknowledged-by: Jane Doe\nSigned-off-by: John Doe\nBREAKING-CHANGE: This is a breaking change\n using multiple lines as value",
    });
  });
});
