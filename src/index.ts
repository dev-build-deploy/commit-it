/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as git from "./git";

type DataSource = "git" | "github";

/**
 * Git data source options
 * @interface IGitDataSourceOptions
 * @member rootPath The root path of the git repository
 */
export interface IGitDataSourceOptions {
  rootPath?: string;
}

/**
 * GitHub data source options
 * @interface IGitHubDataSourceOptions
 * @member owner The GitHub repository owner
 * @member repo The GitHub repository name
 * @member token The GitHub personal access token
 */
export interface IGitHubDataSourceOptions {
  owner: string;
  repo: string;
  token: string;
}

const instanceOfGitDataSourceOptions = (object: IGitDataSourceOptions | IGitHubDataSourceOptions): boolean =>
  !("owner" in object);
const instanceOfGitHubDataSourceOptions = (object: IGitDataSourceOptions | IGitHubDataSourceOptions): boolean =>
  "owner" in object;

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
  commiter?: { name: string; date: Date };
  hash: string;
  subject: string;
  body?: string;
  footer?: string;
}

/**
 * Parses the provided commit message (full message, not just the subject) into
 * a Commit object.
 * @param message The commit message
 * @returns The parsed commit object
 */
export function parseCommitMessage(message: string): { subject: string; body?: string; footer?: string } {
  const isTrailerOnly = (message: string): boolean =>
    message.split(/[\r\n]+/).every(line => {
      const match = /^((BREAKING CHANGE:)|([\w-]+:)|([ \t]+)\w)/.exec(line);
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
    footer: footer,
  };
}

/**
 * Retrieves the commit message (from the indicated source) given the provided SHA hash
 * @param hash SHA of the commit
 * @param source The data source to retrieve the commit message from (git or github)
 * @param options The options to use when retrieving the commit message
 * @returns Commit object
 */
export function getCommitMessage(
  hash: string,
  source: DataSource = "git",
  options?: IGitDataSourceOptions | IGitHubDataSourceOptions
): ICommit {
  switch (source) {
    case "git":
      if (options !== undefined && !instanceOfGitDataSourceOptions(options)) throw new Error("Invalid options");
      return git.getCommitMessage(hash, (options as IGitDataSourceOptions)?.rootPath ?? process.cwd());

    case "github":
      if (options === undefined) throw new Error("GitHub options are required");
      if (!instanceOfGitHubDataSourceOptions(options)) throw new Error("Invalid options");

      // TODO; implement basic GitHub client
      return {
        hash: hash,
        subject: "",
      };
  }
}
