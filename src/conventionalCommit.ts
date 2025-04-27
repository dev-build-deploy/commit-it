/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { DiagnosticsLevelEnum, DiagnosticsMessage } from "@dev-build-deploy/diagnose-it";

import { Commit } from "./commit";
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
  commit: Commit;
  type: IConventionalCommitElement;
  scope: IConventionalCommitElement;
  breaking: IConventionalCommitElement;
  seperator: IConventionalCommitElement;
  description: IConventionalCommitElement;
  body: IConventionalCommitElement;
}

/**
 * Conventional Commit
 * @class ConventionalCommit
 * @member type Conventional Commit type
 * @member scope Conventional Commit scope
 * @member breaking Commit message has a Conventional Commit breaking change (!)
 * @member description Conventional Commit description
 * @member hash Commit hash
 * @member subject Commit subject
 * @member body Commit body
 * @member footer Commit footer
 * @member author Commit author and date
 * @member committer Commit committer and date
 * @member isValid Whether the Conventional Commit is valid
 * @member errors List of error messages
 * @member warnings List of warning messages
 */
export class ConventionalCommit {
  private readonly _raw: IRawConventionalCommit;
  private _errors: DiagnosticsMessage[] = [];
  private _warnings: DiagnosticsMessage[] = [];

  private constructor(raw: IRawConventionalCommit, options?: IConventionalCommitOptions) {
    this._raw = raw;
    this.validate(options);
  }

  /**
   * Creates a new Conventional Commit object from the provided Commit.
   * @param commit Commit to convert to a Conventional Commit
   * @param options Options to use when validating the commit message
   * @returns Conventional Commit
   */
  static fromCommit(commit: Commit, options?: IConventionalCommitOptions): ConventionalCommit {
    // Convert the Commit message to Raw Conventional Commit data
    const rawConvCommit = createRawConventionalCommit(commit);

    // Create a new Conventional Commit object
    return new ConventionalCommit(rawConvCommit, options);
  }

  /**
   * Creates a new Conventional Commit object from the provided string.
   * @param props Hash, message and author/committer information
   * @param options Options to use when validating the commit message
   * @returns Conventional Commit
   */
  static fromString(
    props: {
      hash: string;
      message: string;
      author?: { name: string; date: Date };
      committer?: { name: string; date: Date };
    },
    options?: IConventionalCommitOptions
  ): ConventionalCommit {
    return ConventionalCommit.fromCommit(Commit.fromString(props), options);
  }

  /**
   * Creates a new Conventional Commit object from the provided hash.
   * @param props Hash and root path
   * @param options Options to use when validating the commit message
   * @returns Conventional Commit
   */
  static fromHash(
    props: { hash: string; rootPath?: string },
    options?: IConventionalCommitOptions
  ): ConventionalCommit {
    return ConventionalCommit.fromCommit(Commit.fromHash(props), options);
  }

  // Contributors
  get author(): { name: string; date: Date } | undefined {
    return this._raw.commit.author;
  }
  get committer(): { name: string; date: Date } | undefined {
    return this._raw.commit.committer;
  }

  // Commit
  get hash(): string {
    return this._raw.commit.hash;
  }
  get subject(): string {
    return this._raw.commit.subject;
  }
  get body(): string | undefined {
    return this._raw.commit.body;
  }
  get footer(): Record<string, string> | undefined {
    return this._raw.commit.footer;
  }

  // Conventional Commit
  get type(): string | undefined {
    return this._raw.type.value?.trimEnd();
  }
  get scope(): string | undefined {
    // Removes the parenthesis from the scope
    if (this._raw.scope.value !== undefined) {
      return this._raw.scope.value.trimEnd().replace(/(\(|\))/g, "");
    }
    return this._raw.scope.value;
  }
  get description(): string | undefined {
    return this._raw.description.value;
  }

  get breaking(): boolean {
    return (
      this._raw.breaking.value?.trimEnd() === "!" ||
      (this.footer !== undefined && ("BREAKING CHANGE" in this.footer || "BREAKING-CHANGE" in this.footer))
    );
  }

  // Attributes
  get isFixupCommit(): boolean {
    return this._raw.commit.isFixupCommit;
  }
  get isMergeCommit(): boolean {
    return this._raw.commit.isMergeCommit;
  }

  // Raw
  get raw(): string {
    return this._raw.commit.raw;
  }

  // Validation
  get isValid(): boolean {
    return this._errors.length === 0;
  }
  get warnings(): DiagnosticsMessage[] {
    return this._warnings;
  }
  get errors(): DiagnosticsMessage[] {
    return this._errors;
  }

  toJSON(): { [key: string]: unknown } {
    return {
      hash: this.hash,
      author: this.author,
      committer: this.committer,
      subject: this.subject,
      body: this.body,
      footer: this.footer,
      type: this.type,
      breaking: this.breaking,
      description: this.description,
      validation: {
        isValid: this.isValid,
        errors: this.errors,
        warnings: this.warnings,
      },
      attributes: {
        isFixup: this.isFixupCommit,
        isMerge: this.isMergeCommit,
      },
    };
  }

  // Private validation function
  private validate(options?: IConventionalCommitOptions): void {
    let results: DiagnosticsMessage[] = [];
    requirements.commitRules.forEach(rule => (results = [...results, ...rule.validate(this._raw, options)]));
    this._errors = results.filter(r => r.level === DiagnosticsLevelEnum.Error);
    this._warnings = results.filter(r => r.level === DiagnosticsLevelEnum.Warning);
  }
}

function createRawConventionalCommit(commit: Commit): IRawConventionalCommit {
  const ConventionalCommitRegex = new RegExp(
    /^(?<type>[^(!:]*)(?<scope>\([^)]*\)\s*)?(?<breaking>!\s*)?(?<separator>:\s*)?(?<subject>.*)?$/
  );

  const match = ConventionalCommitRegex.exec(commit.subject.split(/\r?\n/)[0]);
  const conventionalCommit: IRawConventionalCommit = {
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

  return intializeIndices(conventionalCommit);
}
