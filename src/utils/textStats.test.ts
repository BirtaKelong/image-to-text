import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  countCharacters,
  countCharactersNoSpaces,
  countLines,
  estimateReadingTime,
  computeTextStats,
  findMatches,
} from './textStats';

test('countWords handles empty or whitespace text', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   \n\t  '), 0);
});

test('countWords counts English words properly', () => {
  assert.equal(countWords('Hello world! This is OCR.'), 5);
  assert.equal(countWords('One-two three 123'), 4);
});

test('countWords counts Indic scripts (Hindi, Bengali, Assamese)', () => {
  // Hindi: यह एक परीक्षण है (5 words)
  assert.equal(countWords('यह एक परीक्षण है'), 4);
  // Bengali / Assamese: এইটো এটা পৰীক্ষা
  assert.equal(countWords('এইটো এটা পৰীক্ষা'), 3);
});

test('countCharacters and countCharactersNoSpaces work accurately', () => {
  const text = 'OCR Tool\n2026';
  assert.equal(countCharacters(text), 13);
  assert.equal(countCharactersNoSpaces(text), 11);
});

test('countLines calculates line count correctly', () => {
  assert.equal(countLines(''), 0);
  assert.equal(countLines('Single line'), 1);
  assert.equal(countLines('Line 1\nLine 2\nLine 3'), 3);
  assert.equal(countLines('Line 1\r\nLine 2'), 2);
});

test('estimateReadingTime calculates expected minutes', () => {
  assert.equal(estimateReadingTime(0), '0 min');
  assert.equal(estimateReadingTime(150), '1 min');
  assert.equal(estimateReadingTime(450), '3 min');
});

test('computeTextStats aggregates all metrics', () => {
  const stats = computeTextStats('Hello world\nSecond line');
  assert.equal(stats.words, 4);
  assert.equal(stats.lines, 2);
  assert.equal(stats.characters, 23);
});

test('findMatches finds all occurrences', () => {
  const matches = findMatches('Image to Text Converter image', 'image', false);
  assert.equal(matches.length, 2);
  assert.equal(matches[0].index, 0);
  assert.equal(matches[1].index, 24);

  const caseSensitiveMatches = findMatches('Image to Text Converter image', 'image', true);
  assert.equal(caseSensitiveMatches.length, 1);
  assert.equal(caseSensitiveMatches[0].index, 24);
});
