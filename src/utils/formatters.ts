/**
 * Formatting and Sanitization Utilities
 */

export function formatFileSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDimensions(width: number, height: number): string {
  if (!width || !height || width <= 0 || height <= 0) return '0 × 0 px';
  return `${Math.round(width)} × ${Math.round(height)} px`;
}

export function sanitizeFilename(baseName: string, extension: string): string {
  const raw = baseName && baseName.trim().length > 0 ? baseName : 'ocr-extracted-text';
  const clean = raw
    .replace(/[^\w\s\u0900-\u097F\u0980-\u09FF-]/gi, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);

  const finalName = clean.length > 0 ? clean : 'ocr-extracted-text';
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${finalName}${ext}`;
}

export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'application/pdf'];
  const ext = getFileExtension(file.name);
  const validExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'pdf'];

  const typeMatch = validTypes.includes(file.type);
  const extMatch = validExts.includes(ext);

  if (!typeMatch && !extMatch) {
    return {
      valid: false,
      error: `Unsupported file format (${ext || file.type || 'unknown'}). Please upload a JPG, PNG, WEBP, BMP image or PDF document.`,
    };
  }

  // Max size: 25MB
  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum supported file size is 25 MB.`,
    };
  }

  return { valid: true };
}
