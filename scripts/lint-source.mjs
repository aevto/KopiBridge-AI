import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourceDirs = ["app", "components", "lib", "types"];
const sourceExtensions = new Set([".ts", ".tsx"]);
const bannedPatterns = [
  {
    label: "dangerouslySetInnerHTML is not allowed in this prototype.",
    pattern: /dangerouslySetInnerHTML/,
  },
  {
    label: "Do not add the Stage 2 /api/explain route yet.",
    pattern: /\/api\/explain/,
  },
  {
    label: "OpenAI secrets must never use a public environment variable.",
    pattern: /NEXT_PUBLIC_OPENAI_(?:API_)?KEY/,
  },
];

function collectFiles(dir) {
  const absoluteDir = path.join(root, dir);
  const entries = readdirSync(absoluteDir);
  const files = [];

  for (const entry of entries) {
    const absoluteEntry = path.join(absoluteDir, entry);
    const relativeEntry = path.relative(root, absoluteEntry);
    const stats = statSync(absoluteEntry);

    if (stats.isDirectory()) {
      files.push(...collectFiles(relativeEntry));
      continue;
    }

    if (sourceExtensions.has(path.extname(entry))) {
      files.push(absoluteEntry);
    }
  }

  return files;
}

const files = sourceDirs.flatMap(collectFiles);
const failures = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const relativeFile = path.relative(root, file);

  for (const rule of bannedPatterns) {
    if (rule.pattern.test(source)) {
      failures.push(`${relativeFile}: ${rule.label}`);
    }
  }

  if (
    /OPENAI_API_KEY/.test(source) &&
    !["lib/openai-guidance.ts", "lib/openai-media.ts"].includes(relativeFile)
  ) {
    failures.push(
      `${relativeFile}: OPENAI_API_KEY may only be accessed by the server-only OpenAI module.`,
    );
  }

  if (
    ["lib/openai-guidance.ts", "lib/openai-media.ts"].includes(relativeFile) &&
    !source.includes('import "server-only"')
  ) {
    failures.push(`${relativeFile}: OpenAI modules must be server-only.`);
  }

  const sourceFile = ts.createSourceFile(
    relativeFile,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  for (const diagnostic of sourceFile.parseDiagnostics) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      diagnostic.start ?? 0,
    );
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      "\n",
    );
    failures.push(`${relativeFile}:${line + 1}:${character + 1} ${message}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Source lint passed for ${files.length} files.`);
