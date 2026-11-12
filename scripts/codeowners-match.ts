// A small matcher for the CODEOWNERS pattern subset GitHub supports, used by the
// proof test in codeowners.test.ts. GitHub applies the LAST matching line, so
// `ownersFor` walks the rules from the end.
//
// Supported: anchored patterns (a leading or inner `/`), unanchored names that
// match at any depth, `*`, `?`, `**`, and a trailing `/` for "a directory and
// everything under it". Refused with an error, because GitHub does not support
// them in CODEOWNERS and a silent mismatch would give a false answer: a leading
// `!`, character classes (`[`), and escapes (`\`).

export interface Rule {
  /** The pattern exactly as written in the file. */
  pattern: string;
  /** Owners listed on the line. An empty list means the path has no owner. */
  owners: string[];
  /** 1-based line number in the file. */
  line: number;
  regex: RegExp;
}

const UNSUPPORTED = /^!|[[\\]/;

/** Translate one CODEOWNERS pattern to a regular expression over repo-relative paths. */
export function patternToRegExp(rawPattern: string): RegExp {
  if (UNSUPPORTED.test(rawPattern)) {
    throw new Error(`Unsupported CODEOWNERS pattern syntax: ${rawPattern}`);
  }
  let pattern = rawPattern;
  const dirOnly = pattern.endsWith('/');
  if (dirOnly) {
    pattern = pattern.slice(0, -1);
  }
  const anchored = pattern.startsWith('/') || pattern.includes('/');
  if (pattern.startsWith('/')) {
    pattern = pattern.slice(1);
  }

  let body = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern.charAt(i);
    if (ch === '*') {
      if (pattern.charAt(i + 1) === '*') {
        const atStart = i === 0;
        const afterSlash = pattern.charAt(i - 1) === '/';
        const beforeSlash = pattern.charAt(i + 2) === '/';
        const atEnd = i + 2 === pattern.length;
        if (atStart && beforeSlash) {
          // `**/x`: any number of leading directories, including none.
          body += '(?:.*/)?';
          i += 2;
        } else if (afterSlash && beforeSlash) {
          // `a/**/b`: any number of directories in between, including none.
          body += '(?:.*/)?';
          i += 2;
        } else if (afterSlash && atEnd) {
          // `a/**`: everything under a.
          body += '.*';
          i += 1;
        } else {
          body += '.*';
          i += 1;
        }
      } else {
        body += '[^/]*';
      }
    } else if (ch === '?') {
      body += '[^/]';
    } else {
      body += ch.replace(/[.+^${}()|]/g, '\\$&');
    }
  }

  const prefix = anchored ? '^' : '^(?:.*/)?';
  // A directory pattern matches only paths under it; any other pattern also
  // matches the file or directory itself and everything below it.
  const suffix = dirOnly ? '/.*$' : '(?:/.*)?$';
  return new RegExp(prefix + body + suffix);
}

/** Parse the text of a CODEOWNERS file into rules, in file order. */
export function parseCodeowners(text: string): Rule[] {
  const rules: Rule[] = [];
  text.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      return;
    }
    const [pattern, ...rest] = line.split(/\s+/);
    if (pattern === undefined) {
      return;
    }
    // An owner list ends at the first `#`, which starts a trailing comment.
    const commentAt = rest.findIndex((token) => token.startsWith('#'));
    rules.push({
      pattern,
      owners: commentAt === -1 ? rest : rest.slice(0, commentAt),
      line: index + 1,
      regex: patternToRegExp(pattern),
    });
  });
  return rules;
}

/** The owners of a repo-relative path: the last matching rule wins. Empty means unowned. */
export function ownersFor(rules: readonly Rule[], filePath: string): string[] {
  for (let i = rules.length - 1; i >= 0; i -= 1) {
    const rule = rules[i];
    if (rule !== undefined && rule.regex.test(filePath)) {
      return rule.owners;
    }
  }
  return [];
}

export function isOwned(rules: readonly Rule[], filePath: string): boolean {
  return ownersFor(rules, filePath).length > 0;
}
