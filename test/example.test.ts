/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { getCommit, getConventionalCommit, ConventionalCommitError } from "../src/index";
import * as git from "../src/git";

describe("Validate example code in README.md", () => {
  beforeAll(() => {
    Object.defineProperty(git, "gitObjectFolder", { value: "test/environment/objects" });
  });

  test("Git Source", () => {
    // Retrieve commit from your git objects database
    const gitCommit = getCommit({ hash: "f1aaa6e0b89eb87b591ab623053845b5d5488d9f" });

    // OPTIONAL; Conventional Commits options
    const conventionalOptions = {
      // EC-01: A scope MAY be provided after a type. A scope MUST consist of one of the configured values (...) surrounded by parenthesis
      scopes: [ "core", "cli", "action" ],
      
      // EC-02: Commits MUST be prefixed with a type, which consists of one of the configured values (...)
      types: [ "build", "ci", "docs", "perf", "refactor", "style", "test" ],
    }
    const conventionalCommit = getConventionalCommit(gitCommit, conventionalOptions);

    // NOTE: See "Non-compliant Conventional Commits message" for details on how to capture failures.

    console.log(JSON.stringify(conventionalCommit, null, 2))
  });

  test("String Source", () => {
    // Provide a commit message as a string
    const gitCommit = getCommit({
      hash: "0ab1cd2ef",
      message: "feat (no noun): non-compliant conventional commits message",
    });

    try {
      getConventionalCommit(gitCommit); // NOTE: this is an explicit failure
    } catch (error: unknown) {
      if (!(error instanceof ConventionalCommitError)) throw error;

      error.errors.forEach(e => console.log(e.message));
    }
  });
});
