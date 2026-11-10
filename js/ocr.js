/**
 * OCR Engine (Tesseract.js integration with Web Worker management)
 */
import { showToast } from './notifications.js';

export const SUPPORTED_LANGUAGES = [
  { code: 'eng', name: 'English', script: 'Latin', default: true },
  { code: 'hin', name: 'Hindi (हिंदी)', script: 'Devanagari' },
  { code: 'ben', name: 'Bengali (বাংলা)', script: 'Bangla' },
  { code: 'asm', name: 'Assamese (অসমীয়া)', script: 'Asamiya' },
  { code: 'spa', name: 'Spanish (Español)', script: 'Latin' },
  { code: 'fra', name: 'French (Français)', script: 'Latin' },
  { code: 'deu', name: 'German (Deutsch)', script: 'Latin' },
  { code: 'ara', name: 'Arabic (العربية)', script: 'Arabic' },
  { code: 'chi_sim', name: 'Chinese Simplified (简体中文)', script: 'Han' },
  { code: 'jpn', name: 'Japanese (日本語)', script: 'Japanese' },
];

export class OcrEngine {
  constructor(options = {}) {
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    this.activeWorker = null;
    this.isProcessing = false;
    this.currentLanguage = 'eng';
    this.langPath = 'https://tessdata.projectnaptha.com/4.0.0';
  }

  isSupportedLanguage(langCode) {
    return SUPPORTED_LANGUAGES.some((l) => l.code === langCode);
  }

  setLanguage(langCode) {
    if (this.isSupportedLanguage(langCode)) {
      this.currentLanguage = langCode;
      return true;
    }
    return false;
  }

  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Pre-verifies whether language model traineddata is reachable
   */
  async verifyLanguageModel(langCode) {
    try {
      const url = `${this.langPath}/${langCode}.traineddata.gz`;
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (e) {
      // In case HEAD is restricted by CORS or network, return true so Tesseract can attempt load
      return true;
    }
  }

  /**
   * Performs OCR on an image source (canvas, image element, or dataUrl)
   */
  async recognize(imageSource, langCode = this.currentLanguage) {
    if (this.isProcessing) {
      throw new Error('An OCR task is already running.');
    }

    if (!window.Tesseract) {
      throw new Error('Tesseract.js library is not loaded. Please check your internet connection.');
    }

    this.isProcessing = true;
    this.currentLanguage = langCode;

    // Report starting status
    this.onProgress({
      status: 'loading language traineddata',
      progress: 0.05,
      message: `Loading language model (${langCode})...`,
    });

    try {
      // Terminate any previous worker
      if (this.activeWorker) {
        try {
          await this.activeWorker.terminate();
        } catch (e) {
          // ignore
        }
        this.activeWorker = null;
      }

      // Initialize Tesseract worker
      this.activeWorker = await window.Tesseract.createWorker(langCode, 1, {
        langPath: this.langPath,
        logger: (m) => {
          this.handleWorkerMessage(m);
        },
        errorHandler: (err) => {
          console.error('Tesseract Worker Internal Error:', err);
        },
      });

      this.onProgress({
        status: 'recognizing text',
        progress: 0.6,
        message: 'Extracting text with neural OCR...',
      });

      const result = await this.activeWorker.recognize(imageSource);
      const text = result?.data?.text || '';
      const confidence = Math.round(result?.data?.confidence || 0);

      this.onProgress({
        status: 'done',
        progress: 1.0,
        message: 'Extraction complete!',
      });

      this.onComplete({
        text,
        confidence,
        words: result?.data?.words?.length || 0,
        lines: result?.data?.lines?.length || 0,
        language: langCode,
      });

      return { text, confidence };
    } catch (err) {
      console.error('OCR Extraction Error:', err);
      let userFriendlyMessage = err.message || 'Text extraction failed.';

      if (userFriendlyMessage.includes('traineddata') || userFriendlyMessage.includes('Failed to fetch')) {
        userFriendlyMessage = `Could not load traineddata model for "${langCode}". Please verify your network connection or try English.`;
      }

      this.onError(new Error(userFriendlyMessage));
      throw new Error(userFriendlyMessage);
    } finally {
      this.isProcessing = false;
      // Memory cleanup: worker can be kept or terminated
      // We will terminate on cancel or allow garbage collection
    }
  }

  handleWorkerMessage(m) {
    let message = 'Processing image...';
    let percent = m.progress !== undefined ? Math.round(m.progress * 100) : 0;

    switch (m.status) {
      case 'loading tesseract core':
        message = 'Loading OCR WebAssembly core...';
        break;
      case 'loaded tesseract core':
        message = 'OCR Core ready';
        break;
      case 'loading language traineddata':
        message = `Downloading ${this.currentLanguage} language model...`;
        break;
      case 'loaded language traineddata':
        message = 'Language model loaded';
        break;
      case 'initializing tesseract':
        message = 'Initializing OCR neural engine...';
        break;
      case 'initialized tesseract':
        message = 'OCR Engine initialized';
        break;
      case 'recognizing text':
        message = `Recognizing text (${percent}%)...`;
        break;
      default:
        message = m.status || 'Processing...';
    }

    this.onProgress({
      status: m.status,
      progress: m.progress || 0,
      percent,
      message,
    });
  }

  async cancel() {
    if (this.activeWorker) {
      try {
        await this.activeWorker.terminate();
      } catch (e) {
        console.warn('Worker terminate error:', e);
      }
      this.activeWorker = null;
    }
    this.isProcessing = false;
    showToast('OCR extraction cancelled.', 'info');
  }
}
