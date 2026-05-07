#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const strictMode = process.argv.includes('--strict');

const dsRoot = path.join(srcRoot, 'shared', 'ui', 'design-system');
const sharedUiRoot = path.join(srcRoot, 'shared', 'ui');
const dsPrimitivesPath = path.join(dsRoot, 'components', 'dsPrimitives.module.css');
const dsDataTablePath = path.join(dsRoot, 'components', 'DsDataTable.tsx');

const ignoredDirectories = new Set(['node_modules', '.git', 'dist', 'build', '.vite', '.next', '.turbo']);
const jsxExtensions = new Set(['.tsx', '.jsx']);
const moduleCssExtension = '.module.css';

const genericCssWords = new Set([
  'table', 'card', 'badge', 'button', 'btn', 'pill', 'chip', 'header', 'footer',
  'modal', 'spinner', 'input', 'label', 'alert', 'tabs', 'tab', 'panel', 'grid'
]);

const allowedDsPrimitivePrefixes = [
  'button', 'badge', 'card', 'table', 'align', 'action', 'tabs', 'tab', 'inlineMessage',
  'eyebrow', 'stat', 'pageShell'
];

const utilityPatterns = [
  /^(?:container)$/,
  /^(?:hidden|block|inline|inline-block|inline-flex|inline-grid|flex|grid)$/,
  /^(?:flex|grid|col|row|order|basis|grow|shrink)-/,
  /^(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-/,
  /^(?:w|h|min-w|max-w|min-h|max-h)-/,
  /^(?:gap|space-x|space-y)-/,
  /^(?:items|justify|content|self|place)-/,
  /^(?:bg|text|border|rounded|ring|shadow|fill|stroke)-/,
  /^(?:font|leading|tracking|uppercase|lowercase|capitalize|truncate|whitespace)-/,
  /^(?:transition|duration|ease|animate)-/,
  /^(?:overflow|object|z|inset|top|right|bottom|left|opacity|cursor|pointer-events)-/
];

const findings = {
  hexInTsx: [],
  inlineStylesOutsideDs: [],
  tailwindOutsideSharedUi: [],
  genericCssClassesOutsideDs: [],
  renamedButDuplicatedCssSignatures: [],
  dsPrimitivesScope: [],
  dsDataTablePurity: []
};

function isInPath(filePath, folderPath) {
  return filePath === folderPath || filePath.startsWith(folderPath + path.sep);
}

function toRelativePosix(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function walkFiles(directory, collector) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.eslintrc') {
      continue;
    }

    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walkFiles(absolutePath, collector);
      continue;
    }

    collector(absolutePath);
  }
}

function findLine(content, index) {
  return content.slice(0, index).split('\n').length;
}

function collectRegexMatches(content, regex) {
  const matches = [];
  const scoped = new RegExp(regex.source, regex.flags);
  let match = scoped.exec(content);

  while (match) {
    matches.push({
      text: match[0],
      index: match.index,
      line: findLine(content, match.index)
    });
    match = scoped.exec(content);
  }

  return matches;
}

function splitClassNameWords(className) {
  return className
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function isTailwindUtility(token) {
  if (!token) {
    return false;
  }

  const normalized = token.trim().replace(/^!/, '');
  if (!normalized) {
    return false;
  }

  const coreToken = normalized.split(':').at(-1) ?? normalized;
  if (coreToken.includes('[') || coreToken.includes(']')) {
    return true;
  }

  return utilityPatterns.some((pattern) => pattern.test(coreToken));
}

function extractClassNameLiterals(content) {
  const literals = [];
  const classNameRegexes = [
    /className\s*=\s*"([^"]*)"/g,
    /className\s*=\s*'([^']*)'/g,
    /className\s*=\s*\{\s*`([^`]*)`\s*\}/g
  ];

  for (const regex of classNameRegexes) {
    let match = regex.exec(content);
    while (match) {
      literals.push({
        value: match[1],
        line: findLine(content, match.index)
      });
      match = regex.exec(content);
    }
  }

  return literals;
}

function analyzeJsxFile(filePath, content) {
  const relativeFile = toRelativePosix(filePath);

  const hexMatches = collectRegexMatches(content, /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g);
  for (const match of hexMatches) {
    findings.hexInTsx.push({
      file: relativeFile,
      line: match.line,
      detail: match.text
    });
  }

  if (!isInPath(filePath, dsRoot)) {
    const inlineStyleMatches = collectRegexMatches(content, /style\s*=\s*\{\{/g);
    for (const match of inlineStyleMatches) {
      findings.inlineStylesOutsideDs.push({
        file: relativeFile,
        line: match.line,
        detail: 'style={{ ... }}'
      });
    }
  }

  if (!isInPath(filePath, sharedUiRoot)) {
    const classNameLiterals = extractClassNameLiterals(content);
    for (const classLiteral of classNameLiterals) {
      const tokens = classLiteral.value
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      const utilityTokens = tokens.filter(isTailwindUtility);

      if (utilityTokens.length === 0) {
        continue;
      }

      findings.tailwindOutsideSharedUi.push({
        file: relativeFile,
        line: classLiteral.line,
        detail: utilityTokens.join(' ')
      });
    }
  }
}

function analyzeModuleCss(filePath, content, signatureMap) {
  if (isInPath(filePath, dsRoot)) {
    return;
  }

  const relativeFile = toRelativePosix(filePath);
  const classRegex = /^\s*\.([A-Za-z][\w-]*)\b/gm;

  let match = classRegex.exec(content);
  while (match) {
    const className = match[1];
    const words = splitClassNameWords(className);
    const genericWords = words.filter((word) => genericCssWords.has(word));

    if (genericWords.length === 0) {
      match = classRegex.exec(content);
      continue;
    }

    const line = findLine(content, match.index);
    const signature = genericWords.join('+');

    findings.genericCssClassesOutsideDs.push({
      file: relativeFile,
      line,
      detail: `${className} (firma: ${signature})`
    });

    if (!signatureMap.has(signature)) {
      signatureMap.set(signature, []);
    }

    signatureMap.get(signature).push({
      file: relativeFile,
      line,
      className
    });

    match = classRegex.exec(content);
  }
}

function analyzeDsPrimitives() {
  if (!fs.existsSync(dsPrimitivesPath)) {
    findings.dsPrimitivesScope.push({
      file: toRelativePosix(dsPrimitivesPath),
      line: 1,
      detail: 'No se encontró dsPrimitives.module.css'
    });
    return;
  }

  const content = fs.readFileSync(dsPrimitivesPath, 'utf-8');
  const classRegex = /^\s*\.([A-Za-z][\w-]*)\b/gm;

  let match = classRegex.exec(content);
  while (match) {
    const className = match[1];
    const isAllowed = allowedDsPrimitivePrefixes.some((prefix) => className.startsWith(prefix));

    if (!isAllowed) {
      findings.dsPrimitivesScope.push({
        file: toRelativePosix(dsPrimitivesPath),
        line: findLine(content, match.index),
        detail: `Clase fuera del scope de primitives: ${className}`
      });
    }

    match = classRegex.exec(content);
  }
}

function analyzeDsDataTable() {
  if (!fs.existsSync(dsDataTablePath)) {
    findings.dsDataTablePurity.push({
      file: toRelativePosix(dsDataTablePath),
      line: 1,
      detail: 'No se encontró DsDataTable.tsx'
    });
    return;
  }

  const content = fs.readFileSync(dsDataTablePath, 'utf-8');
  const forbiddenTerms = /(asesor|supervisor|gtr|rrhh|proveedor|campa(?:n|ñ)a|tipificaci(?:o|ó)n|preventa)/gi;
  const matches = collectRegexMatches(content, forbiddenTerms);

  for (const match of matches) {
    findings.dsDataTablePurity.push({
      file: toRelativePosix(dsDataTablePath),
      line: match.line,
      detail: `Referencia de dominio detectada: ${match.text}`
    });
  }
}

function printSection(sectionTitle, sectionFindings) {
  console.log(`\n[${sectionTitle}] ${sectionFindings.length}`);

  if (sectionFindings.length === 0) {
    console.log('- OK');
    return;
  }

  const preview = sectionFindings.slice(0, 40);
  for (const finding of preview) {
    console.log(`- ${finding.file}:${finding.line} -> ${finding.detail}`);
  }

  if (sectionFindings.length > preview.length) {
    console.log(`- ... y ${sectionFindings.length - preview.length} hallazgos adicionales`);
  }
}

function runAudit() {
  if (!fs.existsSync(srcRoot)) {
    console.error('No se encontró el directorio src.');
    process.exit(1);
  }

  const signatureMap = new Map();

  walkFiles(srcRoot, (filePath) => {
    const extension = path.extname(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    if (jsxExtensions.has(extension)) {
      analyzeJsxFile(filePath, content);
    }

    if (filePath.endsWith(moduleCssExtension)) {
      analyzeModuleCss(filePath, content, signatureMap);
    }
  });

  for (const [signature, occurrences] of signatureMap.entries()) {
    const files = new Set(occurrences.map((item) => item.file));
    if (files.size < 2) {
      continue;
    }

    const sample = occurrences
      .slice(0, 4)
      .map((entry) => `${entry.className}@${entry.file}:${entry.line}`)
      .join(' | ');

    findings.renamedButDuplicatedCssSignatures.push({
      file: 'src/**/*.module.css',
      line: 1,
      detail: `Firma "${signature}" repetida en ${files.size} archivos. Ejemplos: ${sample}`
    });
  }

  analyzeDsPrimitives();
  analyzeDsDataTable();
}

function totalFindings() {
  return Object.values(findings).reduce((acc, list) => acc + list.length, 0);
}

runAudit();

console.log('============================================================');
console.log('AUDITORIA DESIGN SYSTEM');
console.log('Modo:', strictMode ? 'STRICT (bloqueante)' : 'REPORT (informativo)');
console.log('============================================================');

printSection('Hex en TSX/JSX', findings.hexInTsx);
printSection('Inline style fuera DS', findings.inlineStylesOutsideDs);
printSection('Tailwind className fuera @shared/ui', findings.tailwindOutsideSharedUi);
printSection('Clases genericas en module.css fuera DS', findings.genericCssClassesOutsideDs);
printSection('Firmas CSS duplicadas (renamed but duplicated)', findings.renamedButDuplicatedCssSignatures);
printSection('Scope de dsPrimitives.module.css', findings.dsPrimitivesScope);
printSection('Pureza de DsDataTable', findings.dsDataTablePurity);

const findingsCount = totalFindings();
console.log('\nTotal hallazgos:', findingsCount);

if (strictMode && findingsCount > 0) {
  console.error('Resultado: FAIL (hallazgos detectados en modo estricto)');
  process.exit(1);
}

console.log('Resultado:', findingsCount === 0 ? 'PASS' : 'WARN');
process.exit(0);
