/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import assert from "assert";

import { DiagnosticsMessage } from "@dev-build-deploy/diagnose-it";

import { ICommit } from "./commit";
import * as requirements from "./requirements";

/**
 * Conventional Commit options
 * @interface IConventionalCommitOptions
 * @member scopes List of scopes to use when validating the commit message
 * @member types List of types to use when validating the commit message (NOTE: always includes "feat" and "fix")
 */
export interface IConventionalCommitOptions {
  scopes?: string[];
  types?: string[];
}

/**
 * Conventional Commit element
 * @interface IConventionalCommitElement
 * @member index Index of the element in the commit message
 * @member value Value of the element in the commit message
 * @internal
 */
export type IConventionalCommitElement = {
  index: number;
  value?: string;
};

/**
 * Raw data structure used to validate a Commit message against the Conventional Commit specification.
 * @interface IRawConventionalCommit
 * @member commit Original commit
 * @member type Conventional Commit type
 * @member scope Conventional Commit scope
 * @member seperator Commit message has a Conventional Commit seperator (:)
 * @member breaking Commit message has a Conventional Commit breaking change (!)
 * @member subject Conventional Commit subject
 * @member body Commit message body
 * @internal
 */
export interface IRawConventionalCommit {
  commit: ICommit;
  type: IConventionalCommitElement;
  scope: IConventionalCommitElement;
  breaking: IConventionalCommitElement;
  seperator: IConventionalCommitElement;
  description: IConventionalCommitElement;
  body: IConventionalCommitElement;
}

/**
 * Conventional Commit
 * @interface IConventionalCommit
 * @member type Conventional Commit type
 * @member scope Conventional Commit scope
 * @member breaking Commit message has a Conventional Commit breaking change (!)
 * @member description Conventional Commit description
 */
export interface IConventionalCommit extends ICommit {
  type: string;
  scope?: string;
  breaking?: boolean;
  description: string;
}

/**
 * Conventional Commit error
 * @class ConventionalCommitError
 * @extends Error
 * @member errors List of error messages
 */
export class ConventionalCommitError extends Error {
  errors: DiagnosticsMessage[];
  constructor(errors: DiagnosticsMessage[]) {
    super("Commit is not compliant with the Conventional Commits specification.");
    this.name = "ConventionalCommitError";
    this.errors = errors;
  }
}

/**
 * Returns whether the provided commit has a breaking change (either "!" in subject, or usage of /BREAKING[- ]CHANGE:/).
 * @param commit Commit to check
 * @returns Whether the provided commit has a breaking change
 */
function hasBreakingChange(commit: IRawConventionalCommit): boolean {
  return (
    commit.breaking.value === "!" ||
    (commit.commit.footer !== undefined &&
      ("BREAKING CHANGE" in commit.commit.footer || "BREAKING-CHANGE" in commit.commit.footer))
  );
}

/**
 * Validates a commit message against the Conventional Commit specification.
 * @param commit Commit message to validate against the Conventional Commit specification
 * @returns Conventional Commit mesage
 * @throws ExpressiveMessage[] if the commit message is not a valid Conventional Commit
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 */
function validate(commit: IRawConventionalCommit, options?: IConventionalCommitOptions): IConventionalCommit {
  let errors: DiagnosticsMessage[] = [];

  requirements.commitRules.forEach(rule => (errors = [...errors, ...rule.validate(commit, options)]));
  if (errors.length > 0) throw new ConventionalCommitError(errors);

  // Assume that we have a valid Conventional Commit message
  assert(commit.type.value);
  assert(commit.description.value);

  return {
    ...commit.commit,
    type: commit.type.value,
    scope: commit.scope.value,
    breaking: hasBreakingChange(commit),
    description: commit.description.value,
  };
}

/**
 * Returns whether the provided commit is a Conventional Commit.
 * @param commit Commit to check
 * @returns Whether the provided commit is a Conventional Commit
 */
export function isConventionalCommit(commit: ICommit | IConventionalCommit): boolean {
  return "type" in commit;
}

/**
 * Parses a Commit message into a Conventional Commit.
 * @param commit Commit message to parse
 * @param options Options to use when parsing the commit message
 * @throws ExpressiveMessage[] if the commit message is not a valid Conventional Commit
 * @returns Conventional Commit
 */
export function getConventionalCommit(commit: ICommit, options?: IConventionalCommitOptions): IConventionalCommit {
  const ConventionalCommitRegex = new RegExp(
    /^(?<type>[^(!:]*)(?<scope>\([^)]*\)\s*)?(?<breaking>!\s*)?(?<separator>:\s*)?(?<subject>.*)?$/
  );

  const match = ConventionalCommitRegex.exec(commit.subject);
  let conventionalCommit: IRawConventionalCommit = {
    commit: commit,
    type: { index: 1, value: match?.groups?.type },
    scope: { index: 1, value: match?.groups?.scope },
    breaking: { index: 1, value: match?.groups?.breaking },
    seperator: { index: 1, value: match?.groups?.separator },
    description: { index: 1, value: match?.groups?.subject },
    body: { index: 1, value: commit.body },
  };

  function intializeIndices(commit: IRawConventionalCommit): IRawConventionalCommit {
    commit.scope.index = commit.type.index + (commit.type.value?.length ?? 0);
    commit.breaking.index = commit.scope.index + (commit.scope.value?.length ?? 0);
    commit.seperator.index = commit.breaking.index + (commit.breaking.value?.length ?? 0);
    commit.description.index = commit.seperator.index + (commit.seperator.value?.length ?? 0);
    return commit;
  }

  conventionalCommit = intializeIndices(conventionalCommit);

  return validate(conventionalCommit, options);
}
