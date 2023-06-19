/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as git from "./git";

/**
 * String data source options
 * @interface IStringDataSourceOptions
 * @member hash The commit hash
 * @member author The commit author and date
 * @member commiter The commit commiter and date
 * @member message The commit message
 */
export interface IStringDataSourceOptions {
  hash: string;
  author?: { name: string; date: Date };
  committer?: { name: string; date: Date };
  message: string;
}

/**
 * Git data source options
 * @interface IGitDataSourceOptions
 * @member hash The commit hash
 * @member rootPath The root path of the git repository
 */
export interface IGitDataSourceOptions {
  hash: string;
  rootPath?: string;
}

/**
 * GitHub data source options
 * @interface IGitHubDataSourceOptions
 * @member hash The commit hash
 * @member owner The GitHub repository owner
 * @member repo The GitHub repository name
 * @member token The GitHub personal access token
 */
export interface IGitHubDataSourceOptions {
  hash: string;
  owner: string;
  repo: string;
  token: string;
}

/**
 * Commit information
 * @interface ICommit
 * @member author The commit author and date
 * @member commiter The commit commiter and date
 * @member hash The commit hash
 * @member subject The commit subject
 * @member body The commit body
 * @member footer The commit footer
 */
export interface ICommit {
  author?: { name: string; date: Date };
  committer?: { name: string; date: Date };
  hash: string;
  subject: string;
  body?: string;
  footer?: Record<string, string>;
}

/**
 * Returns a dictionary containing key-value pairs extracted from the footer of the provided commit message.
 * The key must either be:
 * - a single word (optional, using - as a seperator) followed by a colon (:)
 * - BREAKING CHANGE:
 *
 * The value is either:
 * - the remainder of the line
 * - the remainder of the line + anything that follows on the next lines which is indented by at least one space
 */
function parseCommitFooter(footer: string): Record<string, string> | undefined {
  const footerLines = footer.split(/[\r\n]+/);
  const result: Record<string, string> = {};

  for (let lineNr = 0; lineNr < footerLines.length; lineNr++) {
    const line = footerLines[lineNr];
    const match = /^((BREAKING CHANGE:)|([\w-]+(:| #))|([ \t]+)\w)/.exec(line);
    if (match === null) continue;

    let key = match[1].replace(/:$/, "");
    let value = line.substring(match[1].length).trim();
    if (match[1].endsWith(" #")) {
      key = match[1].substring(0, match[1].length - 2);
      value = `#${value}`
    }

    // Check if the value continues on the next line
    while (lineNr + 1 < footerLines.length && footerLines[lineNr + 1].startsWith(" ")) {
      lineNr++;
      value += "\n" + footerLines[lineNr].trim();
    }

    result[key] = value;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Parses the provided commit message (full message, not just the subject) into
 * a Commit object.
 * @param message The commit message
 * @returns The parsed commit object
 * @internal
 */
export function parseCommitMessage(message: string): {
  subject: string;
  body?: string;
  footer?: Record<string, string>;
} {
  const isTrailerOnly = (message: string): boolean =>
    message.split(/[\r\n]+/).every(line => {
      const match = /^((BREAKING CHANGE:)|([\w-]+(:| #))|([ \t]+)\w)/.exec(line);
      return match !== null;
    });

  const paragraphs = message.split(/^[\r\n]+/m);
  let footer: string | undefined = undefined;
  let body: string | undefined = undefined;

  if (paragraphs.length > 1 && isTrailerOnly(paragraphs[paragraphs.length - 1])) {
    footer = paragraphs[paragraphs.length - 1].trim();
    paragraphs.pop();
  }

  if (paragraphs.length > 1) {
    body = paragraphs.splice(1).join("\n").trim();
    if (body === "") body = undefined;
  }

  return {
    subject: paragraphs[0].trim(),
    body: body,
    footer: parseCommitFooter(footer ?? ""),
  };
}

/**
 * Confirms whether the provided commit is a Conventional Commit
 * @param commit
 * @returns
 */
export function isConventionalCommit(commit: ICommit): boolean {
  return "type" in commit;
}

/**
 * Retrieves the commit message (from the indicated source) given the provided SHA hash
 * @param hash SHA of the commit
 * @param source The data source to retrieve the commit message from (git or github)
 * @param options The options to use when retrieving the commit message
 * @returns Commit object
 */
export function getCommit(
  options: IStringDataSourceOptions | IGitDataSourceOptions | IGitHubDataSourceOptions
): ICommit {
  let commit: ICommit;

  // String data source
  if ("message" in options) {
    const stringOptions = options as IStringDataSourceOptions;

    commit = {
      hash: stringOptions.hash,
      ...parseCommitMessage(stringOptions.message),
      author: stringOptions.author,
      committer: stringOptions.committer,
    };
    // GitHub data source
  } else if ("owner" in options) {
    const githubOptions = options as IGitHubDataSourceOptions;

    // TODO; implement basic GitHub client
    commit = {
      hash: githubOptions.hash,
      subject: "",
    };
    // Git data source
  } else {
    const gitOptions = options as IGitDataSourceOptions;
    commit = git.getCommitFromHash(gitOptions.hash, gitOptions.rootPath ?? process.cwd());
  }

  return commit;
}
