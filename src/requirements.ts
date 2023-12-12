/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: MIT
SPDX-License-Identifier: CC-BY-3.0
*/
import { DiagnosticsMessage, FixItHint } from "@dev-build-deploy/diagnose-it";
import chalk from "chalk";

import { IConventionalCommitElement, IConventionalCommitOptions, IRawConventionalCommit } from "./conventional_commit";

/**
 * Conventional Commit requirement
 * @interface ICommitRequirement
 * @member id Requirement identifier
 * @member description Description of the requirement
 * @member validate Validates the commit message
 */
interface ICommitRequirement {
  id: string;
  description: string;

  /**
   * Validates the commit message against the Conventional Commit specification.
   * @throws RequirementError if the commit message is not a valid Conventional Commit
   * @param commit Raw conventional commit data to validate
   */
  validate(commit: IRawConventionalCommit, options?: IConventionalCommitOptions): DiagnosticsMessage[];
}

function highlightString(str: string, substring: string | string[]): string {
  // Ensure that we handle both single and multiple substrings equally
  if (!Array.isArray(substring)) substring = [substring];

  // Replace all instances of substring with a blue version
  let result = str;
  substring.forEach(sub => (result = result.replace(sub, `${chalk.cyan(sub)}`)));
  return result;
}

function createError(
  commit: IRawConventionalCommit,
  description: string,
  highlight: string | string[],
  type: "type" | "scope" | "breaking" | "seperator" | "spacing" | "description"
): DiagnosticsMessage {
  const data = commit[type.toString() as keyof IRawConventionalCommit] as IConventionalCommitElement;

  return DiagnosticsMessage.createError(commit.commit.hash, {
    text: highlightString(description, highlight),
    linenumber: 1,
    column: data.index,
  })
    .setContext(
      1,
      commit.commit.body !== undefined && commit.commit.body.split("\n").length >= 1
        ? [commit.commit.subject, "", ...commit.commit.body.split("\n")]
        : [commit.commit.subject]
    )
    .addFixitHint(FixItHint.create({ index: data.index, length: data.value?.length ?? 1 }));
}

/**
 * Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc.,
 * followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.
 */
class CC01 implements ICommitRequirement {
  id = "CC-01";
  description =
    "Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];

    // MUST be prefixed with a type
    if (!commit.type.value || commit.type.value.trim().length === 0) {
      errors.push(createError(commit, this.description, "MUST be prefixed with a type", "type"));
    } else {
      // Ensure that we have a noun
      if (commit.type.value.trim().includes(" ") || /[^a-z]/i.test(commit.type.value.trim()))
        errors.push(createError(commit, this.description, "which consists of a noun", "type"));
      // Validate for spacing after the type
      if (commit.type.value.trim() !== commit.type.value) {
        if (commit.scope.value)
          errors.push(createError(commit, this.description, "followed by the OPTIONAL scope", "scope"));
        else if (commit.breaking.value)
          errors.push(createError(commit, this.description, ["followed by the", "OPTIONAL !"], "breaking"));
        else
          errors.push(
            createError(commit, this.description, ["followed by the", "REQUIRED terminal colon"], "seperator")
          );
      }

      // Validate for spacing after the scope, breaking and seperator
      if (commit.scope.value && commit.scope.value.trim() !== commit.scope.value)
        errors.push(createError(commit, this.description, "followed by the OPTIONAL scope", "scope"));
      if (commit.breaking.value && commit.breaking.value.trim() !== commit.breaking.value)
        errors.push(createError(commit, this.description, ["followed by the", "OPTIONAL !"], "breaking"));
      if (commit.seperator.value && commit.seperator.value.trim() !== commit.seperator.value)
        errors.push(createError(commit, this.description, ["followed by the", "REQUIRED terminal colon"], "seperator"));
    }

    // MUST have a terminal colon
    if (!commit.seperator.value)
      errors.push(createError(commit, this.description, ["followed by the", "REQUIRED terminal colon"], "seperator"));
    // MUST have a space after the terminal colon
    else if (!commit.spacing.value || commit.spacing.value.length !== 1)
      errors.push(createError(commit, this.description, ["followed by the", "REQUIRED", "space"], "spacing"));

    return errors;
  }
}

/**
 * A scope MAY be provided after a type. A scope MUST consist of a noun describing
 * a section of the codebase surrounded by parenthesis, e.g., fix(parser):
 */
class CC04 implements ICommitRequirement {
  id = "CC-04";
  description =
    "A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., fix(parser):";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];

    if (
      commit.scope.value &&
      (commit.scope.value.includes(" ") ||
        commit.scope.value === "()" ||
        /[^a-z]/i.test(commit.scope.value.substring(1, commit.scope.value.length - 1)))
    ) {
      errors.push(createError(commit, this.description, "A scope MUST consist of a noun", "scope"));
    }

    return errors;
  }
}

/**
 * A description MUST immediately follow the colon and space after the type/scope prefix.
 * The description is a short summary of the code changes, e.g., fix: array parsing issue
 * when multiple spaces were contained in string.
 */
class CC05 implements ICommitRequirement {
  id = "CC-05";
  description =
    "A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., fix: array parsing issue when multiple spaces were contained in string.";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];

    if (!commit.seperator.value) return errors;
    if (!commit.spacing.value || commit.spacing.value.length > 1 || !commit.description.value)
      errors.push(
        createError(
          commit,
          this.description,
          "A description MUST immediately follow the colon and space",
          "description"
        )
      );

    return errors;
  }
}

/**
 * A scope MAY be provided after a type. A scope MUST consist of one of the configured values (...) surrounded by parenthesis
 */
class EC01 implements ICommitRequirement {
  id = "EC-01";
  description =
    "A scope MAY be provided after a type. A scope MUST consist of one of the configured values (...) surrounded by parenthesis";

  validate(commit: IRawConventionalCommit, options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const uniqueScopeList = Array.from(new Set<string>(options?.scopes ?? []));
    if (uniqueScopeList.length === 0) return [];

    if (commit.scope.value === undefined || uniqueScopeList.includes(commit.scope.value.replace(/[()]+/g, "")))
      return [];

    this.description = `A scope MAY be provided after a type. A scope MUST consist of one of the configured values (${uniqueScopeList.join(
      ", "
    )}) surrounded by parenthesis`;

    return [
      createError(commit, this.description, ["A scope MUST consist of", `(${uniqueScopeList.join(", ")})`], "scope"),
    ];
  }
}

/**
 * Commits MUST be prefixed with a type, which consists of one of the configured values (feat, fix, ...)
 */
class EC02 implements ICommitRequirement {
  id = "EC-02";
  description = "Commits MUST be prefixed with a type, which consists of one of the configured values (feat, fix, ...)";

  validate(commit: IRawConventionalCommit, options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const uniqueAddedTypes = new Set<string>(options?.types ?? []);
    if (uniqueAddedTypes.has("feat")) uniqueAddedTypes.delete("feat");
    if (uniqueAddedTypes.has("fix")) uniqueAddedTypes.delete("fix");
    const expectedTypes = ["feat", "fix", ...Array.from(uniqueAddedTypes)];

    this.description = `Commits MUST be prefixed with a type, which consists of one of the configured values (${expectedTypes.join(
      ", "
    )}).`;

    if (commit.type.value !== undefined && expectedTypes.includes(commit.type.value)) return [];

    return [
      createError(
        commit,
        this.description,
        ["prefixed with a type, which consists of", `(${expectedTypes.join(", ")})`],
        "type"
      ),
    ];
  }
}

/** @internal */
export const commitRules: ICommitRequirement[] = [new CC01(), new CC04(), new CC05(), new EC01(), new EC02()];
