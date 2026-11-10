import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  formatDimensions,
  sanitizeFilename,
  getFileExtension,
} from './formatters';

test('formatFileSize formats bytes correctly', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(1024), '1.0 KB');
  assert.equal(formatFileSize(1024 * 1024 * 2.5), '2.5 MB');
});

test('formatDimensions formats width and height', () => {
  assert.equal(formatDimensions(0, 0), '0 × 0 px');
  assert.equal(formatDimensions(1920, 1080), '1920 × 1080 px');
});

test('sanitizeFilename removes illegal characters and appends extension', () => {
  assert.equal(sanitizeFilename('invoice #123?!', 'txt'), 'invoice_123.txt');
  assert.equal(sanitizeFilename('my_document', '.pdf'), 'my_document.pdf');
  assert.equal(sanitizeFilename('', 'docx'), 'ocr-extracted-text.docx');
});

test('getFileExtension extracts clean extension', () => {
  assert.equal(getFileExtension('scan.PNG'), 'png');
  assert.equal(getFileExtension('document.pdf'), 'pdf');
  assert.equal(getFileExtension('sample'), '');
});
