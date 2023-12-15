/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
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
 * Commit information
 * @interface ICommit
 * @member author The commit author and date
 * @member commiter The commit commiter and date
 * @member hash The commit hash
 * @member subject The commit subject
 * @member body The commit body
 * @member footer The commit footer
 * @internal
 */
export interface ICommit {
  author?: { name: string; date: Date };
  committer?: { name: string; date: Date };
  hash: string;
  raw: string;
  subject: string;
  body?: string;
  footer?: Record<string, string>;
}

const TRAILER_REGEX = /^((BREAKING CHANGE:)|([\w-]+(:| #))|([ \t]+)\w*)/i;

/**
 * Git Commit
 * @class Commit
 * @member author The commit author and date
 * @member commiter The commit commiter and date
 * @member hash The commit hash
 * @member subject The commit subject
 * @member body The commit body
 * @member footer The commit footer
 * @member raw The commit message
 */
export class Commit {
  private _commit: ICommit;

  private constructor(commit: ICommit) {
    this._commit = commit;
  }

  /**
   * Retrieves the commit information from git using the provided hash
   * @param props The commit hash and root path
   * @returns The commit object
   */
  static fromHash(props: { hash: string; rootPath?: string }): Commit {
    const commit = git.getCommitFromHash(props.hash, props.rootPath ?? process.cwd());
    return new Commit(commit);
  }

  /**
   * Creates a Commit object from the provided string
   * @param props The commit hash, author, committer and message
   * @returns The commit object
   */
  static fromString(props: {
    hash: string;
    message: string;
    author?: { name: string; date: Date };
    committer?: { name: string; date: Date };
  }): Commit {
    const commit = {
      hash: props.hash,
      ...parseCommitMessage(props.message),
      author: props.author,
      committer: props.committer,
      raw: props.message,
    };
    return new Commit(commit);
  }

  get author(): { name: string; date: Date } | undefined {
    return this._commit.author;
  }
  get committer(): { name: string; date: Date } | undefined {
    return this._commit.committer;
  }
  get hash(): string {
    return this._commit.hash;
  }
  get subject(): string {
    return this._commit.subject;
  }
  get body(): string | undefined {
    return this._commit.body;
  }
  get footer(): Record<string, string> | undefined {
    return this._commit.footer;
  }
  get raw(): string {
    return this._commit.raw;
  }

  toJSON(): ICommit {
    return this._commit;
  }
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
 *
 * @internal
 */
export function getFooterElementsFromParagraph(
  footer: string
): { lineNumber: number; key: string; value: string }[] | undefined {
  const footerLines = footer.split(/\r?\n/);
  const result: { lineNumber: number; key: string; value: string }[] = [];

  for (let lineNr = 0; lineNr < footerLines.length; lineNr++) {
    const line = footerLines[lineNr];
    const match = TRAILER_REGEX.exec(line);
    if (match === null) continue;

    let key = match[1].replace(/:$/, "");
    let value = line.substring(match[1].length).trim();
    if (match[1].endsWith(" #")) {
      key = match[1].substring(0, match[1].length - 2);
      value = `#${value}`;
    }

    const matchLine = lineNr;

    // Check if the value continues on the next line
    while (
      lineNr + 1 < footerLines.length &&
      (/^\s/.test(footerLines[lineNr + 1]) || footerLines[lineNr + 1].length === 0)
    ) {
      lineNr++;
      value += "\n" + footerLines[lineNr].trim();
    }
    result.push({
      lineNumber: matchLine + 1,
      key,
      value,
    });
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
    message.split(/\r?\n/).every(line => {
      const match = TRAILER_REGEX.exec(line);
      return match !== null;
    });

  const paragraphs = message.split(/^\r?\n/m);
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
    footer: getFooterElementsFromParagraph(footer ?? "")?.reduce((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {} as Record<string, string>),
  };
}
