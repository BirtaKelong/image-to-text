/**
 * Text Statistics & Processing Utilities
 * Pure functions for counting words, characters, lines, and finding text matches.
 */

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  readingTime: string;
}

/**
 * Accurately counts words across English, Hindi, Bengali, Assamese, and other scripts.
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  // Trim and match word clusters (letters, numbers, and combining marks like Indic matras)
  const trimmed = text.trim();
  const matches = trimmed.match(/[\p{L}\p{N}\p{M}]+/gu);
  return matches ? matches.length : 0;
}

export function countCharacters(text: string): number {
  return text ? text.length : 0;
}

export function countCharactersNoSpaces(text: string): number {
  if (!text) return 0;
  return text.replace(/\s+/g, '').length;
}

export function countLines(text: string): number {
  if (!text || text.length === 0) return 0;
  return text.split(/\r\n|\r|\n/).length;
}

export function estimateReadingTime(words: number, wpm: number = 200): string {
  if (words <= 0) return '0 min';
  const minutes = Math.ceil(words / wpm);
  return `${minutes} min`;
}

export function computeTextStats(text: string): TextStats {
  const characters = countCharacters(text);
  const charactersNoSpaces = countCharactersNoSpaces(text);
  const words = countWords(text);
  const lines = countLines(text);
  const readingTime = estimateReadingTime(words);

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    readingTime,
  };
}

export interface MatchOccurrence {
  index: number;
  length: number;
}

export function findMatches(text: string, query: string, caseSensitive: boolean = false): MatchOccurrence[] {
  if (!text || !query) return [];
  const matches: MatchOccurrence[] = [];
  const src = caseSensitive ? text : text.toLowerCase();
  const q = caseSensitive ? query : query.toLowerCase();
  let pos = 0;

  while ((pos = src.indexOf(q, pos)) !== -1) {
    matches.push({ index: pos, length: q.length });
    pos += q.length;
  }

  return matches;
}
