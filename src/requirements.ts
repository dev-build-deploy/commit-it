/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 *
 * SPDX-License-Identifier: MIT
 * SPDX-License-Identifier: CC-BY-3.0
 */
import { DiagnosticsLevelEnum, DiagnosticsMessage, FixItHint } from "@dev-build-deploy/diagnose-it";
import chalk from "chalk";

import { getFooterElementsFromParagraph } from "./commit";
import { IConventionalCommitElement, IConventionalCommitOptions, IRawConventionalCommit } from "./conventionalCommit";

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

function isNoun(str: string): boolean {
  return !str.trim().includes(" ") && !/[^a-z]/i.test(str.trim());
}

function highlightString(str: string, substring: string | string[]): string {
  // Ensure that we handle both single and multiple substrings equally
  if (!Array.isArray(substring)) substring = [substring];

  // Replace all instances of substring with a blue version
  let result = str;
  substring.forEach(sub => (result = result.replace(sub, `${chalk.cyan(sub)}`)));
  return result;
}

function createDiagnosticsMessage(
  commit: IRawConventionalCommit,
  description: string,
  highlight: string | string[],
  type: keyof IRawConventionalCommit,
  whitespace = false,
  level: DiagnosticsLevelEnum = DiagnosticsLevelEnum.Error
): DiagnosticsMessage {
  const element = commit[type] as IConventionalCommitElement;
  let hintIndex = element.index;
  let hintLength = element.value?.trimEnd().length ?? 1;

  if (whitespace) {
    let prevElement: IConventionalCommitElement | undefined = undefined;
    for (const [_key, value] of Object.entries(commit)) {
      if (value.index > (prevElement?.index ?? 0) && value.index < element.index) {
        prevElement = value;
      }
    }

    hintIndex = prevElement ? prevElement.index + (prevElement.value?.trimEnd().length ?? 1) : 1;
    hintLength = (prevElement?.value?.length ?? 1) - (prevElement?.value?.trimEnd().length ?? 1);
  }

  return new DiagnosticsMessage({
    file: commit.commit.hash,
    level,
    message: {
      text: highlightString(description, highlight),
      linenumber: 1,
      column: hintIndex,
    },
  })
    .setContext(1, commit.commit.subject.split(/\r?\n/)[0])
    .addFixitHint(FixItHint.create({ index: hintIndex, length: hintLength === 0 ? 1 : hintLength }));
}

/**
 * Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc.,
 * followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.
 */
class CC01 implements ICommitRequirement {
  id = "CC-01";
  description =
    "Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.";

  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];

    // MUST be prefixed with a type
    if (!commit.type.value || commit.type.value.trim().length === 0) {
      // Validated with EC-02
    } else {
      // Ensure that we have a noun
      if (!isNoun(commit.type.value))
        errors.push(createDiagnosticsMessage(commit, this.description, "which consists of a noun", "type"));
      // Validate for spacing after the type
      if (commit.type.value.trim() !== commit.type.value) {
        if (commit.scope.value) {
          errors.push(
            createDiagnosticsMessage(commit, this.description, "followed by the OPTIONAL scope", "scope", true)
          );
        } else if (commit.breaking.value) {
          errors.push(
            createDiagnosticsMessage(commit, this.description, ["followed by the", "OPTIONAL !"], "breaking", true)
          );
        } else {
          errors.push(
            createDiagnosticsMessage(
              commit,
              this.description,
              ["followed by the", "REQUIRED terminal colon"],
              "seperator",
              true
            )
          );
        }
      }

      // Validate for spacing after the scope, breaking and seperator
      if (commit.scope.value && commit.scope.value.trim() !== commit.scope.value) {
        if (commit.breaking.value) {
          errors.push(
            createDiagnosticsMessage(commit, this.description, ["followed by the", "OPTIONAL !"], "breaking", true)
          );
        } else {
          errors.push(
            createDiagnosticsMessage(
              commit,
              this.description,
              ["followed by the", "REQUIRED terminal colon"],
              "seperator",
              true
            )
          );
        }
      }

      if (commit.breaking.value && commit.breaking.value.trim() !== commit.breaking.value) {
        errors.push(
          createDiagnosticsMessage(
            commit,
            this.description,
            ["followed by the", "REQUIRED terminal colon"],
            "seperator",
            true
          )
        );
      }
    }

    // MUST have a terminal colon
    if (!commit.seperator.value) {
      errors.push(
        createDiagnosticsMessage(commit, this.description, ["followed by the", "REQUIRED terminal colon"], "seperator")
      );
    }

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

  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];

    if (
      commit.scope.value &&
      (commit.scope.value === "()" ||
        !isNoun(commit.scope.value.trimEnd().substring(1, commit.scope.value.trimEnd().length - 1)))
    ) {
      errors.push(createDiagnosticsMessage(commit, this.description, "A scope MUST consist of a noun", "scope"));
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

  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];

    if (!commit.seperator.value) {
      return errors;
    }

    if (
      commit.description.value === undefined ||
      commit.seperator.value.length - commit.seperator.value.trim().length !== 1
    ) {
      errors.push(
        createDiagnosticsMessage(
          commit,
          this.description,
          "A description MUST immediately follow the colon and space",
          "description",
          true
        )
      );
    }

    return errors;
  }
}

/**
 * A longer commit body MAY be provided after the short description, providing
 * additional contextual information about the code changes. The body MUST begin one
 * blank line after the description.
 */
class CC06 implements ICommitRequirement {
  id = "CC-06";
  description =
    "A longer commit body MAY be provided after the short description, providing additional contextual information about the code changes. The body MUST begin one blank line after the description.";

  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];
    if (!commit.commit.subject) {
      return errors;
    }

    const lines = commit.commit.subject.split(/\r?\n/);

    if (lines.length > 1) {
      return [
        DiagnosticsMessage.createError(commit.commit.hash, {
          text: highlightString(this.description, "The body MUST begin one blank line after the description"),
          linenumber: 2,
          column: 1,
        })
          .setContext(1, lines)
          .addFixitHint(FixItHint.createRemoval({ index: 1, length: lines[1].length })),
      ];
    }

    return errors;
  }
}

/**
 * The units of information that make up Conventional Commits MUST NOT be treated as case
 * sensitive by implementors, with the exception of BREAKING CHANGE which MUST be uppercase.
 */
class CC15 implements ICommitRequirement {
  id = "CC-15";
  description =
    "The units of information that make up Conventional Commits MUST NOT be treated as case sensitive by implementors, with the exception of BREAKING CHANGE which MUST be uppercase.";

  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];
    const footerElements = getFooterElementsFromParagraph(commit.commit.raw);
    if (footerElements === undefined) return errors;

    for (const element of footerElements) {
      if (["BREAKING CHANGE", "BREAKING-CHANGE"].includes(element.key.toUpperCase())) {
        if (element.key !== element.key.toUpperCase()) {
          errors.push(
            DiagnosticsMessage.createError(commit.commit.hash, {
              text: highlightString(this.description, "BREAKING CHANGE MUST be uppercase"),
              linenumber: element.lineNumber,
              column: 1,
            })
              .setContext(element.lineNumber, commit.commit.raw.split(/\r?\n/)[element.lineNumber - 1])
              .addFixitHint(FixItHint.create({ index: 1, length: element.key.length }))
          );
        }
      }
    }

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
    if (uniqueScopeList.length === 0) {
      return [];
    }

    if (commit.scope.value === undefined || uniqueScopeList.includes(commit.scope.value.replace(/[()]+/g, ""))) {
      return [];
    }

    this.description = `A scope MAY be provided after a type. A scope MUST consist of one of the configured values (${uniqueScopeList.join(
      ", "
    )}) surrounded by parenthesis`;

    return [
      createDiagnosticsMessage(
        commit,
        this.description,
        ["A scope MUST consist of", `(${uniqueScopeList.join(", ")})`],
        "scope"
      ),
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

    this.description = `Commits ${
      uniqueAddedTypes.size > 0 ? "MUST" : "MAY"
    } be prefixed with a type, which consists of one of the configured values (${expectedTypes.join(", ")}).`;

    if (
      commit.type.value === undefined ||
      !isNoun(commit.type.value) ||
      expectedTypes.includes(commit.type.value.toLowerCase().trimEnd())
    ) {
      return [];
    }

    if (commit.type.value.trim().length === 0) {
      return [createDiagnosticsMessage(commit, this.description, "prefixed with a type", "type")];
    }

    if (uniqueAddedTypes.size > 0) {
      return [
        createDiagnosticsMessage(
          commit,
          this.description,
          ["prefixed with a type, which consists of", `(${expectedTypes.join(", ")})`],
          "type"
        ),
      ];
    } else {
      return [
        createDiagnosticsMessage(
          commit,
          this.description,
          ["prefixed with a type, which consists of", `(${expectedTypes.join(", ")})`],
          "type",
          false,
          DiagnosticsLevelEnum.Warning
        ),
      ];
    }
  }
}

/**
 * A `BREAKING CHANGE` git-trailer has been found in the body of the commit message and will be ignored as it MUST be included in the footer.
 */
class WA01 implements ICommitRequirement {
  id = "WA-01";
  description =
    "A `BREAKING CHANGE` git-trailer has been found in the body of the commit message and will be ignored as it MUST be included in the footer.";

  validate(commit: IRawConventionalCommit, _options?: IConventionalCommitOptions): DiagnosticsMessage[] {
    const errors: DiagnosticsMessage[] = [];

    if (commit.commit.body === undefined) return errors;

    const elements = getFooterElementsFromParagraph(commit.commit.body);
    if (elements === undefined) return errors;

    for (const element of elements) {
      if (element.key === "BREAKING CHANGE" || element.key === "BREAKING-CHANGE") {
        errors.push(
          DiagnosticsMessage.createWarning(commit.commit.hash, {
            text: highlightString(
              `A \`${element.key}\` git-trailer has been found in the body of the commit message and will be ignored as it MUST be included in the footer.`,
              [element.key, "will be ignored as it MUST be included in the footer"]
            ),
            linenumber: commit.commit.subject.split(/\r?\n/).length + element.lineNumber,
            column: 1,
          })
            .setContext(commit.commit.subject.split(/\r?\n/).length + 1, commit.commit.body.split(/\r?\n/))
            .addFixitHint(FixItHint.create({ index: 1, length: element.key.length }))
        );
      }
    }

    return errors;
  }
}

/** @internal */
export const commitRules: ICommitRequirement[] = [
  new CC01(),
  new CC04(),
  new CC05(),
  new CC06(),
  new CC15(),
  new EC01(),
  new EC02(),
  new WA01(),
];
