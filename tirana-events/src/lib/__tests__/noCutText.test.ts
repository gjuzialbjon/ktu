// the app has no Node types; this test runs in Jest (Node), so declare the little it uses
declare const __dirname: string;
declare function require(m: string): unknown;
const { readdirSync, readFileSync, statSync } = require('fs') as {
  readdirSync(p: string): string[];
  readFileSync(p: string, enc: 'utf8'): string;
  statSync(p: string): { isDirectory(): boolean };
};
const { join } = require('path') as { join(...parts: string[]): string };

/**
 * House rule: text is never cut off. No ellipsis, no clamped line counts: text wraps, and the
 * box around it grows (cards use minHeight, not height). This fails the build if a clamp
 * comes back anywhere in the app.
 */
const SRC = join(__dirname, '..', '..');
const CLAMPS = /\b(numberOfLines|ellipsizeMode|adjustsFontSizeToFit)\b|textOverflow|WebkitLineClamp/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === '__tests__' ? [] : files(p);
    return /\.tsx?$/.test(name) ? [p] : [];
  });
}

test('no text in the app can be cut off', () => {
  const hits = files(SRC).flatMap((f) =>
    readFileSync(f, 'utf8')
      .split('\n')
      .map((line, i) => (CLAMPS.test(line) ? `${f.slice(SRC.length + 1)}:${i + 1}  ${line.trim()}` : null))
      .filter(Boolean),
  );
  expect(hits).toEqual([]);
});
