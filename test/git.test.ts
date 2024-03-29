/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { ICommit } from "../src/commit";
import * as git from "../src/git";
import { Commit } from "../src/index";

describe("Get Commit Message from git", () => {
  beforeAll(() => {
    Object.defineProperty(git, "gitObjectFolder", { value: "test/environment/objects" });
  });

  test("Hash from Local Repository", () => {
    const commit = Commit.fromHash({ hash: "4b1c9f2e8d113892fb7bfc388606c82ce0572b95" });
    expect(commit).toEqual({
      _commit: {
        raw: `feat: add support to retrieve commits from a git source by SHA

This commit introduces custom parsing of the objects and pack files
in .git/objects. Rationale: remove any need for external dependencies
(albeit packages or tools).

Calling \`getCommitMessage(...)\` will return a standard ICommit object`,
        author: {
          name: "Kevin de Jong <monkaii@hotmail.com>",
          date: new Date("2023-06-16T15:01:30.000Z"),
        },
        committer: {
          name: "Kevin de Jong <monkaii@hotmail.com>",
          date: new Date("2023-06-18T00:19:43.000Z"),
        },
        hash: "4b1c9f2e8d113892fb7bfc388606c82ce0572b95",
        subject: "feat: add support to retrieve commits from a git source by SHA",
        body: `This commit introduces custom parsing of the objects and pack files
in .git/objects. Rationale: remove any need for external dependencies
(albeit packages or tools).

Calling \`getCommitMessage(...)\` will return a standard ICommit object`,
        footer: undefined,
        attributes: { isFixup: false, isMerge: false },
      } as ICommit,
    });
  });

  test("Hash from Pack file", () => {
    const commit = Commit.fromHash({ hash: "78e505dc465c3c39a179f6d24970c2f0f0dccad9" });
    expect(commit).toEqual({
      _commit: {
        raw: `Initial commit`,
        author: {
          name: "Kevin de Jong <134343960+Kevin-de-Jong@users.noreply.github.com>",
          date: new Date("2023-06-16T14:28:58.000Z"),
        },
        committer: {
          name: "GitHub <noreply@github.com>",
          date: new Date("2023-06-16T14:28:58.000Z"),
        },
        hash: "78e505dc465c3c39a179f6d24970c2f0f0dccad9",
        subject: "Initial commit",
        body: undefined,
        footer: undefined,
        attributes: { isFixup: false, isMerge: false },
      } as ICommit,
    });
  });

  test("Invalid hash", () => {
    expect(() => Commit.fromHash({ hash: "d0dbf83579080ee214b50551a2be587b218e4088" })).toThrow(
      "Could not find commit message for hash d0dbf83579080ee214b50551a2be587b218e4088"
    );
  });

  test("Invalid git folder", () => {
    expect(() =>
      Commit.fromHash({ hash: "4b1c9f2e8d113892fb7bfc388606c82ce0572b95", rootPath: "does/not/exists" })
    ).toThrow("Invalid git folder specified (does/not/exists/test/environment/objects)");
  });

  test("Invalid hash and git folder", () => {
    expect(() =>
      Commit.fromHash({ hash: "d0dbf83579080ee214b50551a2be587b218e4088", rootPath: "does/not/exists" })
    ).toThrow("Invalid git folder specified (does/not/exists/test/environment/objects)");
  });
});
