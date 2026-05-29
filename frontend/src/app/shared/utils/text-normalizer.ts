export type TextNormalizationMode = 'titleCase' | 'personName';

const WORD_SEPARATOR_REGEX = /(\s+|-|')/;

export function normalizeTextValue(value: string, mode: TextNormalizationMode = 'titleCase'): string {
  const collapsed = collapseWhitespace(value);
  if (!collapsed) {
    return '';
  }

  switch (mode) {
    case 'personName':
    case 'titleCase':
    default:
      return toTitleCase(collapsed);
  }
}

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function toTitleCase(value: string): string {
  return value
    .toLocaleLowerCase()
    .split(' ')
    .map((word) => normalizeDelimitedWord(word))
    .join(' ');
}

function normalizeDelimitedWord(word: string): string {
  return word
    .split(WORD_SEPARATOR_REGEX)
    .map((part) => {
      if (!part || WORD_SEPARATOR_REGEX.test(part)) {
        return part;
      }

      return part.charAt(0).toLocaleUpperCase() + part.slice(1);
    })
    .join('');
}
