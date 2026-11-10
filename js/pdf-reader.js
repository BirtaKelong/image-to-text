/**
 * PDF Document Reader (PDF.js)
 */
import { showToast } from './notifications.js';

export class PdfReader {
  constructor(options = {}) {
    this.onPageRendered = options.onPageRendered || (() => {});
    this.onDigitalTextExtracted = options.onDigitalTextExtracted || (() => {});

    this.navBar = document.getElementById('pdf-nav-bar');
    this.prevBtn = document.getElementById('btn-pdf-prev');
    this.nextBtn = document.getElementById('btn-pdf-next');
    this.indicator = document.getElementById('pdf-page-indicator');
    this.extractDigitalBtn = document.getElementById('btn-pdf-digital-text');

    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;

    this.init();
  }

  init() {
    // Configure worker
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.renderPage(this.currentPage - 1);
        }
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        if (this.currentPage < this.totalPages) {
          this.renderPage(this.currentPage + 1);
        }
      });
    }

    if (this.extractDigitalBtn) {
      this.extractDigitalBtn.addEventListener('click', () => {
        this.extractDigitalTextFromCurrentPage();
      });
    }
  }

  async loadPdf(typedArray, filename = 'document.pdf') {
    if (!window.pdfjsLib) {
      showToast('PDF.js library is loading, please try again.', 'error');
      return;
    }

    try {
      const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;

      if (this.navBar) this.navBar.classList.add('active');
      await this.renderPage(1);

      // Check if page has digital text
      this.checkDigitalText();
    } catch (err) {
      console.error('Error loading PDF:', err);
      showToast(`Failed to parse PDF document: ${err.message}`, 'error', 'PDF Error');
    }
  }

  async renderPage(pageNumber) {
    if (!this.pdfDoc || pageNumber < 1 || pageNumber > this.totalPages) return;

    this.currentPage = pageNumber;
    this.updateIndicator();

    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x high resolution for OCR

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/png');

      this.onPageRendered({
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        pageNumber,
        totalPages: this.totalPages,
      });
    } catch (err) {
      console.error('Error rendering page:', err);
      showToast('Failed to render PDF page.', 'error');
    }
  }

  updateIndicator() {
    if (this.indicator) {
      this.indicator.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    }
    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentPage <= 1;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentPage >= this.totalPages;
    }
  }

  async checkDigitalText() {
    try {
      const page = await this.pdfDoc.getPage(this.currentPage);
      const textContent = await page.getTextContent();
      const hasText = textContent.items && textContent.items.length > 5;
      if (this.extractDigitalBtn) {
        this.extractDigitalBtn.style.display = hasText ? 'inline-flex' : 'none';
      }
    } catch (e) {
      // Ignore
    }
  }

  async extractDigitalTextFromCurrentPage() {
    if (!this.pdfDoc) return;
    try {
      showToast('Extracting embedded digital text...', 'info');
      const page = await this.pdfDoc.getPage(this.currentPage);
      const textContent = await page.getTextContent();
      
      // Combine lines preserving paragraphs
      let lastY = null;
      let text = '';
      for (const item of textContent.items) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
          text += '\n';
        } else if (text.length > 0 && !text.endsWith('\n') && !text.endsWith(' ')) {
          text += ' ';
        }
        text += item.str;
        lastY = item.transform[5];
      }

      if (text.trim().length > 0) {
        this.onDigitalTextExtracted(text.trim());
        showToast(`Extracted ${text.trim().split(/\s+/).length} words from digital PDF!`, 'success', 'Digital Text Extracted');
      } else {
        showToast('No digital text found on this page. Use "Extract Text" for OCR.', 'info');
      }
    } catch (err) {
      console.error('Digital text extraction error:', err);
      showToast('Could not extract digital text.', 'error');
    }
  }

  hide() {
    if (this.navBar) this.navBar.classList.remove('active');
    this.pdfDoc = null;
  }
}
