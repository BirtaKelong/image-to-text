/**
 * Main Application Orchestrator
 */
import { showToast } from './notifications.js';
import { UploadManager } from './upload.js';
import { ImageEditor } from './image-editor.js';
import { PdfReader } from './pdf-reader.js';
import { OcrEngine, SUPPORTED_LANGUAGES } from './ocr.js';
import { TextEditor } from './text-editor.js';
import { ExportManager } from './export.js';
import { generateSampleInvoice, generateSampleMultilingual } from './samples.js';
import { formatFileSize, formatDimensions } from '../src/utils/formatters.ts';

class App {
  constructor() {
    this.currentFileName = 'sample-document';
    this.currentFileSize = 0;
    this.currentWidth = 0;
    this.currentHeight = 0;
    this.hasActiveMedia = false;

    // DOM Elements
    this.dropzone = document.getElementById('dropzone');
    this.previewContainer = document.getElementById('preview-container');
    this.extractBtn = document.getElementById('btn-extract-text');
    this.stopOcrBtn = document.getElementById('btn-stop-ocr');
    this.languageSelect = document.getElementById('language-select');
    this.themeToggleBtn = document.getElementById('btn-toggle-theme');

    // Progress elements
    this.progressBox = document.getElementById('ocr-progress-box');
    this.progressStatus = document.getElementById('progress-status-text');
    this.progressPercent = document.getElementById('progress-percent');
    this.progressBarFill = document.getElementById('progress-bar-fill');

    // Metadata bar
    this.metaFileName = document.getElementById('meta-file-name');
    this.metaDimensions = document.getElementById('meta-dimensions');
    this.metaFileSize = document.getElementById('meta-file-size');

    // Modals
    this.featuresModal = document.getElementById('features-modal');
    this.aboutModal = document.getElementById('about-modal');

    this.init();
  }

  init() {
    this.initTheme();
    this.initLanguageSelector();
    this.initModules();
    this.initUIEventListeners();
    this.refreshIcons();

    // Check for sample or query param autostart
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sample') === 'invoice' || urlParams.get('autostart') === '1') {
      this.loadSampleInvoice();
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem('ocr_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);

    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ocr_theme', next);
        this.updateThemeIcon(next);
      });
      this.updateThemeIcon(initialTheme);
    }
  }

  updateThemeIcon(theme) {
    if (!this.themeToggleBtn) return;
    this.themeToggleBtn.innerHTML =
      theme === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }

  initLanguageSelector() {
    if (!this.languageSelect) return;
    this.languageSelect.innerHTML = '';

    SUPPORTED_LANGUAGES.forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = `${lang.name} [${lang.script}]`;
      if (lang.default) opt.selected = true;
      this.languageSelect.appendChild(opt);
    });

    this.languageSelect.addEventListener('change', (e) => {
      const langCode = e.target.value;
      this.ocrEngine.setLanguage(langCode);
      const selected = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
      showToast(`Selected language: ${selected?.name || langCode}`, 'info');
    });
  }

  initModules() {
    // 1. Text Editor
    this.textEditor = new TextEditor();

    // 2. Export Manager
    this.exportManager = new ExportManager({
      getText: () => this.textEditor.getText(),
      getSourceFileName: () => this.currentFileName,
    });

    // 3. Image Editor
    this.imageEditor = new ImageEditor({
      onDimensionsChange: (width, height) => {
        this.currentWidth = width;
        this.currentHeight = height;
        if (this.metaDimensions) {
          this.metaDimensions.textContent = formatDimensions(width, height);
        }
      },
    });

    // 4. PDF Reader
    this.pdfReader = new PdfReader({
      onPageRendered: ({ dataUrl, width, height, pageNumber, totalPages }) => {
        this.hasActiveMedia = true;
        this.currentWidth = width;
        this.currentHeight = height;
        this.showPreviewView();
        this.imageEditor.loadImage(dataUrl, width, height);
        this.updateFileMetadata(
          `${this.currentFileName} (Page ${pageNumber})`,
          this.currentFileSize,
          width,
          height
        );
      },
      onDigitalTextExtracted: (text) => {
        this.textEditor.setText(text);
      },
    });

    // 5. OCR Engine
    this.ocrEngine = new OcrEngine({
      onProgress: (info) => this.handleOcrProgress(info),
      onComplete: (result) => this.handleOcrComplete(result),
      onError: (err) => this.handleOcrError(err),
    });

    // 6. Upload Manager
    this.uploadManager = new UploadManager({
      onImageReady: (data) => {
        this.pdfReader.hide();
        this.hasActiveMedia = true;
        this.currentFileName = data.name;
        this.currentFileSize = data.size;
        this.currentWidth = data.width;
        this.currentHeight = data.height;

        this.showPreviewView();
        this.imageEditor.loadImage(data.src, data.width, data.height);
        this.updateFileMetadata(data.name, data.size, data.width, data.height);
      },
      onPdfReady: (data) => {
        this.currentFileName = data.name;
        this.currentFileSize = data.size;
        this.pdfReader.loadPdf(data.data, data.name);
      },
      onClear: () => {
        this.clearActiveMedia();
      },
    });
  }

  showPreviewView() {
    if (this.dropzone) this.dropzone.classList.add('hidden');
    if (this.previewContainer) this.previewContainer.classList.add('active');
    if (this.extractBtn) this.extractBtn.disabled = false;
  }

  clearActiveMedia() {
    this.hasActiveMedia = false;
    this.pdfReader.hide();
    this.imageEditor.destroyCropper();
    if (this.dropzone) this.dropzone.classList.remove('hidden');
    if (this.previewContainer) this.previewContainer.classList.remove('active');
    if (this.extractBtn) this.extractBtn.disabled = true;
    this.updateFileMetadata('No media loaded', 0, 0, 0);
  }

  updateFileMetadata(name, size, width, height) {
    if (this.metaFileName) this.metaFileName.textContent = name;
    if (this.metaFileSize) this.metaFileSize.textContent = formatFileSize(size);
    if (this.metaDimensions) this.metaDimensions.textContent = formatDimensions(width, height);
  }

  initUIEventListeners() {
    // Toolbar Buttons
    const rotateBtn = document.getElementById('btn-tool-rotate');
    const zoomInBtn = document.getElementById('btn-tool-zoomin');
    const zoomOutBtn = document.getElementById('btn-tool-zoomout');
    const cropBtn = document.getElementById('btn-tool-crop');
    const adjustBtn = document.getElementById('btn-tool-adjust');
    const resetBtn = document.getElementById('btn-tool-reset');
    const adjustmentsPanel = document.getElementById('adjustments-panel');

    if (rotateBtn) rotateBtn.addEventListener('click', () => this.imageEditor.rotate());
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.imageEditor.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.imageEditor.zoomOut());
    if (cropBtn) cropBtn.addEventListener('click', () => this.imageEditor.toggleCrop());
    if (adjustBtn && adjustmentsPanel) {
      adjustBtn.addEventListener('click', () => {
        adjustmentsPanel.classList.toggle('open');
        adjustBtn.classList.toggle('active', adjustmentsPanel.classList.contains('open'));
      });
    }
    if (resetBtn) resetBtn.addEventListener('click', () => this.imageEditor.reset());

    // Extract Text Button
    if (this.extractBtn) {
      this.extractBtn.addEventListener('click', () => this.startExtraction());
    }

    // Stop OCR Button
    if (this.stopOcrBtn) {
      this.stopOcrBtn.addEventListener('click', () => {
        this.ocrEngine.cancel();
        this.resetOcrProgressUI();
      });
    }

    // Sample Loaders
    const sampleInvoiceBtn = document.getElementById('btn-sample-invoice');
    const sampleMultiBtn = document.getElementById('btn-sample-multilingual');

    if (sampleInvoiceBtn) {
      sampleInvoiceBtn.addEventListener('click', () => this.loadSampleInvoice());
    }

    if (sampleMultiBtn) {
      sampleMultiBtn.addEventListener('click', () => this.loadSampleMultilingual());
    }

    // Modals & Navigation
    this.initModals();

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Enter to trigger OCR
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!this.extractBtn.disabled && !this.ocrEngine.isProcessing) {
          e.preventDefault();
          this.startExtraction();
        }
      }
      // Escape closes modals or cancel crop
      if (e.key === 'Escape') {
        if (this.imageEditor.isCropping) {
          this.imageEditor.cancelCrop();
        }
        document.querySelectorAll('.modal-overlay.open').forEach((m) => m.classList.remove('open'));
      }
    });
  }

  initModals() {
    const navFeaturesBtn = document.getElementById('nav-features');
    const navAboutBtn = document.getElementById('nav-about');
    const closeFeaturesBtn = document.getElementById('btn-close-features');
    const closeAboutBtn = document.getElementById('btn-close-about');

    if (navFeaturesBtn && this.featuresModal) {
      navFeaturesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.featuresModal.classList.add('open');
      });
    }

    if (navAboutBtn && this.aboutModal) {
      navAboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.aboutModal.classList.add('open');
      });
    }

    if (closeFeaturesBtn && this.featuresModal) {
      closeFeaturesBtn.addEventListener('click', () => this.featuresModal.classList.remove('open'));
    }

    if (closeAboutBtn && this.aboutModal) {
      closeAboutBtn.addEventListener('click', () => this.aboutModal.classList.remove('open'));
    }

    // Backdrop click
    document.querySelectorAll('.modal-overlay').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });
  }

  loadSampleInvoice() {
    const dataUrl = generateSampleInvoice();
    this.uploadManager.loadFromDataUrl(dataUrl, 'sample_invoice_2026.png', 900, 700);
    if (this.languageSelect) {
      this.languageSelect.value = 'eng';
      this.ocrEngine.setLanguage('eng');
    }
  }

  loadSampleMultilingual() {
    const dataUrl = generateSampleMultilingual();
    this.uploadManager.loadFromDataUrl(dataUrl, 'multilingual_specimen.png', 900, 700);
  }

  async startExtraction() {
    if (!this.hasActiveMedia) {
      showToast('Please upload an image or PDF document first.', 'warning');
      return;
    }

    // If currently cropping, apply crop automatically before running OCR
    if (this.imageEditor.isCropping) {
      this.imageEditor.applyCrop();
    }

    const selectedLang = this.languageSelect ? this.languageSelect.value : 'eng';
    this.ocrEngine.setLanguage(selectedLang);

    // Prepare UI
    if (this.progressBox) this.progressBox.classList.add('active');
    if (this.extractBtn) this.extractBtn.style.display = 'none';
    if (this.stopOcrBtn) this.stopOcrBtn.classList.add('active');

    try {
      // Obtain the processed canvas with user's rotation, crop, and adjustments baked in
      const canvas = await this.imageEditor.getProcessedCanvas();
      await this.ocrEngine.recognize(canvas, selectedLang);
    } catch (err) {
      console.error('Extraction error:', err);
      // Handled in ocrEngine.onError
    }
  }

  handleOcrProgress(info) {
    if (this.progressStatus) this.progressStatus.textContent = info.message || 'Processing...';
    const percent = Math.min(100, Math.max(0, info.percent || Math.round((info.progress || 0) * 100)));
    if (this.progressPercent) this.progressPercent.textContent = `${percent}%`;
    if (this.progressBarFill) this.progressBarFill.style.width = `${percent}%`;
  }

  handleOcrComplete(result) {
    this.resetOcrProgressUI();
    this.textEditor.setText(result.text);

    const wordCount = result.words || result.text.trim().split(/\s+/).length;
    showToast(
      `Extracted ${wordCount} words (Confidence: ${result.confidence}%)`,
      'success',
      'Text Extraction Finished'
    );
  }

  handleOcrError(err) {
    this.resetOcrProgressUI();
    showToast(err.message || 'OCR processing failed.', 'error', 'Extraction Failed');
  }

  resetOcrProgressUI() {
    if (this.progressBox) this.progressBox.classList.remove('active');
    if (this.extractBtn) {
      this.extractBtn.style.display = 'inline-flex';
      this.extractBtn.disabled = !this.hasActiveMedia;
    }
    if (this.stopOcrBtn) this.stopOcrBtn.classList.remove('active');
    if (this.progressBarFill) this.progressBarFill.style.width = '0%';
    if (this.progressPercent) this.progressPercent.textContent = '0%';
  }

  refreshIcons() {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  }
}

// Start application once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
