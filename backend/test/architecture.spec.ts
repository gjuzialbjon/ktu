import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structure rules from ARCHITECTURE.md, checked on every `npm test`. When one fails, the
 * file is in the wrong place or reaches across a boundary: fix the import, don't loosen the rule.
 */
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const MODULES = join(SRC, 'modules');
const SHARED = resolve(SRC, '../../shared/src');
/** the only things a module folder may contain besides <name>.module.ts and index.ts */
const MODULE_LAYERS = ['http', 'application', 'data', 'jobs'] as const;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const files = walk(SRC).filter((f) => !f.endsWith('.spec.ts'));
const rel = (f: string) => relative(SRC, f).split(sep).join('/');

/** import/export specifiers of a file, resolved to paths inside src/ when relative */
function importsOf(file: string): { spec: string; target: string | null }[] {
  // comments may mention imports ('import from X'); only real statements count
  const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const specs = [...code.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)].map(
    (m) => (m[1] ?? m[2]) as string,
  );
  return specs.map((spec) => ({
    spec,
    target: spec.startsWith('.') ? rel(resolve(dirname(file), spec).replace(/\.js$/, '.ts')) : null,
  }));
}

/** ['modules', 'events', 'http', 'x.ts'] → { module: 'events', layer: 'http' } */
function placeOf(path: string): { module?: string; layer?: string } {
  const parts = path.split('/');
  if (parts[0] !== 'modules') return {};
  return { module: parts[1], layer: parts.length > 3 ? parts[2] : undefined };
}

const moduleNames = readdirSync(MODULES).filter((n) => statSync(join(MODULES, n)).isDirectory());

describe('architecture', () => {
  it.each(moduleNames)('module "%s" has its wiring file, a public index and only known layers', (name) => {
    const entries = readdirSync(join(MODULES, name));
    expect(entries).toContain(`${name}.module.ts`);
    expect(entries).toContain('index.ts');
    const unknown = entries.filter(
      (e) =>
        statSync(join(MODULES, name, e)).isDirectory() && !(MODULE_LAYERS as readonly string[]).includes(e),
    );
    expect(unknown).toEqual([]);
  });

  it('platform and config never depend on feature modules', () => {
    const bad = files
      .filter((f) => /^(platform|config)\//.test(rel(f)))
      .flatMap((f) => importsOf(f).filter((i) => i.target?.startsWith('modules/')).map((i) => `${rel(f)} → ${i.spec}`));
    expect(bad).toEqual([]);
  });

  it('modules reach each other only through their public index.ts', () => {
    const bad = files.flatMap((f) => {
      const from = placeOf(rel(f));
      if (!from.module) return [];
      return importsOf(f)
        .filter((i) => {
          const to = i.target ? placeOf(i.target) : {};
          return to.module && to.module !== from.module && i.target !== `modules/${to.module}/index.ts`;
        })
        .map((i) => `${rel(f)} → ${i.spec}`);
    });
    expect(bad).toEqual([]);
  });

  it('inside a module, layers point one way: http → application → data', () => {
    const allowed: Record<string, string[]> = {
      http: ['http', 'application'],
      application: ['application', 'data'],
      data: ['data'],
      jobs: ['jobs', 'application', 'data'],
    };
    const bad = files.flatMap((f) => {
      const from = placeOf(rel(f));
      if (!from.module || !from.layer) return [];
      return importsOf(f)
        .filter((i) => {
          const to = i.target ? placeOf(i.target) : {};
          return to.module === from.module && !!to.layer && !allowed[from.layer ?? ""]?.includes(to.layer);
        })
        .map((i) => `${rel(f)} → ${i.spec}`);
    });
    expect(bad).toEqual([]);
  });

  it('only data/ layers and the database platform talk to Drizzle', () => {
    const bad = files
      .filter((f) => !/^(platform\/database\/|modules\/[^/]+\/data\/)/.test(rel(f)))
      .flatMap((f) => importsOf(f).filter((i) => i.spec.startsWith('drizzle-orm')).map((i) => `${rel(f)} → ${i.spec}`));
    expect(bad).toEqual([]);
  });

  it('tables live in data/*.table.ts, where drizzle-kit looks for them', () => {
    const bad = files.filter((f) => /pgTable\(/.test(readFileSync(f, 'utf8')) && !/\/data\/[^/]+\.table\.ts$/.test(rel(f)));
    expect(bad.map(rel)).toEqual([]);
  });

  it('shared/ imports nothing but its own files (it runs in the app and on the server, with no dependencies)', () => {
    const bad = walk(SHARED).flatMap((f) =>
      importsOf(f)
        .filter((i) => !i.spec.startsWith('./') && !i.spec.startsWith('../'))
        .map((i) => `shared/src/${relative(SHARED, f).split(sep).join('/')} → ${i.spec}`),
    );
    expect(bad).toEqual([]);
  });

  it('shared/ relative imports name the .ts file, as Node needs to load them', () => {
    const bad = walk(SHARED).flatMap((f) =>
      importsOf(f)
        .filter((i) => i.spec.startsWith('.') && !i.spec.endsWith('.ts'))
        .map((i) => `shared/src/${relative(SHARED, f).split(sep).join('/')} → ${i.spec}`),
    );
    expect(bad).toEqual([]);
  });
});
