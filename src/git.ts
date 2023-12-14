/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";

import * as ccommit from "./commit";

/** @internal */
type NameAndDateType = { name: string; date: Date };

/** @internal */
type GitCommitType = {
  hash: string;
  raw: string;
  author?: NameAndDateType;
  committer?: NameAndDateType;
  subject: string;
  body?: string;
  footer?: Record<string, string>;
};

/** @internal */
export const gitObjectFolder = ".git/objects";

/**
 * Converts seconds since epoch and timezone information to a Date object
 * @param epoch Seconds since epoch
 * @param timezone Timezone offset in minutes
 * @returns Date object
 */
const dateToUTC = (epoch: number, timezone: number): Date => new Date(epoch * 1000 - timezone * 60000);

/**
 * Splits the provided string into a name and date object;
 * Example:
 *   "John Doe 1686937738 +0200" => { name: "John Doe", date: Date(2023-06-16T14:28:58.000Z) }
 *
 * @param value String to split
 * @returns Name and date object
 */
function extractNameAndDate(value?: string): NameAndDateType | undefined {
  if (value === undefined) return undefined;
  const valueSplit = value.split(" ");
  const [epoch, timezone] = valueSplit.splice(-2).map(v => Number.parseInt(v));

  return {
    name: valueSplit.splice(0, value.length - 2).join(" "),
    date: dateToUTC(epoch, timezone),
  };
}

/**
 * Extracts Key/Value pairs from the commit message
 * @param commit Commit message
 * @param key Key to extract
 * @returns Value of the key
 */
function getValueFromKey(commit: string, key: string): string | undefined {
  const match = new RegExp("^" + key + " (.*)$", "m").exec(commit);
  return match ? match[1] : undefined;
}

/**
 * Parses a commit message into a Commit object
 * @param commit Commit message
 * @param hash Commit hash
 * @returns Commit object
 */
function parseCommitMessage(commit: string, hash: string): GitCommitType {
  const author = extractNameAndDate(getValueFromKey(commit, "author"));
  const committer = extractNameAndDate(getValueFromKey(commit, "committer"));
  const raw = commit
    .split(/^[\r\n]+/m)
    .splice(1)
    .join("\n")
    .trim();

  return {
    raw,
    hash: hash,
    author: author,
    committer: committer,
    ...ccommit.parseCommitMessage(raw),
  };
}

/**
 * Reads a (local) commit message from the .git/objects folder
 * @param hash Hash of the commit to read
 * @returns Commit object or undefined if the commit could not be found in the local repository
 */
function getCommitFromLocalObjects(hash: string, rootPath: string): ccommit.ICommit | undefined {
  const objectPath = path.join(rootPath, gitObjectFolder, hash.substring(0, 2), "/", hash.substring(2));
  if (!fs.existsSync(objectPath)) return undefined;

  const commit = zlib.inflateSync(fs.readFileSync(objectPath)).toString();
  return parseCommitMessage(commit, hash);
}

/**
 * Iterates through all pack files and returns the commit message for the provided hash
 * @param hash Hash of the commit to read
 * @param rootPath Path to the git repository
 * @returns Commit object or undefined if the commit could not be found in the pack files
 */
function getCommitFromPackFile(hash: string, rootPath: string): ccommit.ICommit | undefined {
  for (const entry of fs.readdirSync(path.join(rootPath, gitObjectFolder, "pack"))) {
    const filePath = path.join(rootPath, gitObjectFolder, "pack", entry);
    if (path.extname(filePath) !== ".idx") continue;

    const hashes = readIdxFile(filePath);
    if (hashes[hash] === undefined) continue;

    const commit = readPackFile(filePath.replace(".idx", ".pack"), hashes[hash].readUint32BE());
    return parseCommitMessage(commit, hash);
  }
}

/**
 * Returns a Commit object for the provided hash
 * @param hash Hash of the commit to read
 * @returns Commit object
 * @internal
 */
export function getCommitFromHash(hash: string, rootPath: string): ccommit.ICommit {
  if (!fs.existsSync(path.join(rootPath, gitObjectFolder)))
    throw new Error(`Invalid git folder specified (${path.join(rootPath, gitObjectFolder)})`);

  let message = getCommitFromLocalObjects(hash, rootPath);
  if (message !== undefined) return message;

  message = getCommitFromPackFile(hash, rootPath);
  if (message !== undefined) return message;

  throw new Error("Could not find commit message for hash " + hash);
}

/**
 * Retrieves a single listing (block) from an git index file
 * @param idxBuffer Buffer containing the index file
 * @param index Starting index to read from
 * @param length Length (in bytes) of a single entry
 * @param size Number of entries to read
 * @returns Object containing the data and the index after reading
 */
function readIdxListing(
  idxBuffer: Buffer,
  index: number,
  length: number,
  size: number
): { data: Buffer[]; index: number } {
  const result: Buffer[] = [];
  const end = index + size * length;
  while (index < end) {
    result.push(idxBuffer.subarray(index, index + length));
    index += length;
  }

  return { data: result, index: index };
}

/**
 * Reads a file from the file system from the specified index and length
 * @param file File to read
 * @param index Starting index to read from
 * @param length Length (in bytes) to read
 * @returns Buffer containing the data
 */
function readFile(file: string, index: number, length: number): Buffer {
  const buffer = Buffer.alloc(length);

  const fd = fs.openSync(file, "r");
  fs.readSync(fd, buffer, 0, length, index);
  fs.closeSync(fd);

  return buffer;
}

/**
 * Parses a git Index file and returns a hashmap of all SHA's and their offsets in the pack file
 * @param path Path to the .idx file
 * @returns Hashmap of SHA's and their offsets in the pack file
 */
function readIdxFile(path: string): { [sha: string]: Buffer } {
  const idxFile = fs.readFileSync(path);
  const version = idxFile.readUint32BE(4);
  assert(version === 2);

  const fanout: string[] = [];
  for (let index = 0; index < 256; index++) {
    const byte = idxFile.subarray(8 + index * 4, 8 + (index + 1) * 4);
    fanout.push(byte.toString("hex"));
  }

  const size = Number.parseInt(fanout[fanout.length - 1], 16);

  const { data: shaListing, index: endSha } = readIdxListing(idxFile, 1032, 20, size);
  const { index: endCrc } = readIdxListing(idxFile, endSha, 4, size);
  const { data: packFileOffsets } = readIdxListing(idxFile, endCrc, 4, size);

  const hashMap: { [sha: string]: Buffer } = {};
  shaListing.forEach((sha, index) => {
    hashMap[sha.toString("hex")] = packFileOffsets[index];
  });

  return hashMap;
}

/**
 * Reads a git pack file and returns the contents of the specified index
 * @param path Path to the .pack file
 * @param index Index of the object to read
 * @returns Contents of the object
 */
function readPackFile(path: string, index: number): string {
  const header = readFile(path, 0, 8);
  assert(header.subarray(0, 4).toString() === "PACK");

  const version = header.readUint32BE(4);
  assert(version === 2);

  const entry = readFile(path, index, 20);
  let hunk = entry.readUint8(0);
  const type = (hunk & 0x70) >> 4;
  assert(type === 1); // TODO; Support other types

  let size = (hunk & 0x70) >> 4;
  let lastHunk = (hunk & 0x80) !== 0x80;
  let hunkId = 1;

  while (!lastHunk) {
    hunk = entry.readUint8(0 + hunkId);
    size |= (hunk & 0x7f) << (4 + 7 * (hunkId - 1));
    lastHunk = (hunk & 0x80) !== 0x80;
    hunkId++;
  }

  return zlib.inflateSync(readFile(path, index + hunkId, size)).toString();
}
