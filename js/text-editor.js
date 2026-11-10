/**
 * Text Editor Module (Counters, Copy, Clear, Search & Find)
 */
import { showToast } from './notifications.js';

export class TextEditor {
  constructor(options = {}) {
    this.onTextChange = options.onTextChange || (() => {});

    this.textarea = document.getElementById('editor-textarea');
    this.wordCountEl = document.getElementById('stat-words');
    this.charCountEl = document.getElementById('stat-chars');
    this.charNoSpacesEl = document.getElementById('stat-chars-no-space');
    this.lineCountEl = document.getElementById('stat-lines');
    this.readingTimeEl = document.getElementById('stat-reading-time');

    // Action buttons
    this.copyBtn = document.getElementById('btn-copy-text');
    this.selectAllBtn = document.getElementById('btn-select-all');
    this.clearBtn = document.getElementById('btn-clear-text');
    
    // Find in text
    this.findToggleBtn = document.getElementById('btn-toggle-find');
    this.findBar = document.getElementById('find-bar');
    this.findInput = document.getElementById('find-input');
    this.findCount = document.getElementById('find-count');
    this.findPrevBtn = document.getElementById('btn-find-prev');
    this.findNextBtn = document.getElementById('btn-find-next');

    // Clear confirmation modal
    this.clearModal = document.getElementById('clear-modal');
    this.confirmClearBtn = document.getElementById('btn-confirm-clear');
    this.cancelClearBtn = document.getElementById('btn-cancel-clear');

    this.matchIndices = [];
    this.currentMatchIndex = -1;

    this.init();
  }

  init() {
    if (!this.textarea) return;

    // Real-time counter updates on input
    this.textarea.addEventListener('input', () => {
      this.updateStats();
      this.onTextChange(this.textarea.value);
      if (this.findInput && this.findInput.value) {
        this.performFind(this.findInput.value);
      }
    });

    // Copy text
    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    // Select All
    if (this.selectAllBtn) {
      this.selectAllBtn.addEventListener('click', () => {
        this.textarea.focus();
        this.textarea.select();
        showToast('All text selected.', 'info');
      });
    }

    // Clear Text
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        if (!this.textarea.value.trim()) {
          showToast('Text editor is already empty.', 'info');
          return;
        }
        if (this.clearModal) {
          this.clearModal.classList.add('open');
        } else if (confirm('Are you sure you want to clear all extracted text?')) {
          this.clear();
        }
      });
    }

    if (this.confirmClearBtn) {
      this.confirmClearBtn.addEventListener('click', () => {
        this.clear();
        if (this.clearModal) this.clearModal.classList.remove('open');
      });
    }

    if (this.cancelClearBtn) {
      this.cancelClearBtn.addEventListener('click', () => {
        if (this.clearModal) this.clearModal.classList.remove('open');
      });
    }

    // Find in text
    if (this.findToggleBtn && this.findBar) {
      this.findToggleBtn.addEventListener('click', () => {
        this.findBar.classList.toggle('open');
        if (this.findBar.classList.contains('open')) {
          this.findInput.focus();
          if (this.findInput.value) this.performFind(this.findInput.value);
        } else {
          this.resetFind();
        }
      });
    }

    if (this.findInput) {
      this.findInput.addEventListener('input', (e) => {
        this.performFind(e.target.value);
      });
      this.findInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) this.prevMatch();
          else this.nextMatch();
        } else if (e.key === 'Escape') {
          if (this.findBar) this.findBar.classList.remove('open');
          this.resetFind();
          this.textarea.focus();
        }
      });
    }

    if (this.findNextBtn) {
      this.findNextBtn.addEventListener('click', () => this.nextMatch());
    }

    if (this.findPrevBtn) {
      this.findPrevBtn.addEventListener('click', () => this.prevMatch());
    }

    this.updateStats();
  }

  setText(text) {
    if (!this.textarea) return;
    this.textarea.value = text || '';
    this.updateStats();
    this.onTextChange(this.textarea.value);
  }

  appendText(text) {
    if (!this.textarea) return;
    const current = this.textarea.value;
    this.textarea.value = current ? `${current}\n\n${text}` : text;
    this.updateStats();
    this.onTextChange(this.textarea.value);
  }

  getText() {
    return this.textarea ? this.textarea.value : '';
  }

  clear() {
    if (!this.textarea) return;
    this.textarea.value = '';
    this.updateStats();
    this.resetFind();
    this.onTextChange('');
    showToast('Text cleared.', 'info');
  }

  updateStats() {
    const text = this.getText();
    const chars = text.length;
    const charsNoSpace = text.replace(/\s+/g, '').length;
    
    // Accurate multilingual word counting (English, Indic scripts, CJK, etc.)
    const wordsMatch = text.trim().match(/[\p{L}\p{N}\p{M}]+/gu);
    const words = wordsMatch ? wordsMatch.length : 0;
    
    const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
    const minutes = Math.ceil(words / 200);
    const readingTime = words === 0 ? '0 min' : `${minutes} min`;

    if (this.wordCountEl) this.wordCountEl.textContent = words.toLocaleString();
    if (this.charCountEl) this.charCountEl.textContent = chars.toLocaleString();
    if (this.charNoSpacesEl) this.charNoSpacesEl.textContent = charsNoSpace.toLocaleString();
    if (this.lineCountEl) this.lineCountEl.textContent = lines.toLocaleString();
    if (this.readingTimeEl) this.readingTimeEl.textContent = readingTime;

    // Toggle export buttons disabled state
    const exportBtns = document.querySelectorAll('.btn-export');
    const hasText = text.trim().length > 0;
    exportBtns.forEach((btn) => {
      btn.disabled = !hasText;
    });
  }

  async copyToClipboard() {
    const text = this.getText();
    if (!text.trim()) {
      showToast('No text to copy.', 'warning');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for restricted clipboard
        this.textarea.select();
        document.execCommand('copy');
      }
      showToast('Text copied to clipboard!', 'success', 'Copied');
    } catch (err) {
      console.warn('Clipboard write error:', err);
      // Fallback
      this.textarea.select();
      document.execCommand('copy');
      showToast('Text copied to clipboard!', 'success', 'Copied');
    }
  }

  performFind(query) {
    const text = this.getText();
    this.matchIndices = [];
    this.currentMatchIndex = -1;

    if (!query || !text) {
      if (this.findCount) this.findCount.textContent = '0/0';
      return;
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let pos = 0;

    while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
      this.matchIndices.push({ start: pos, end: pos + lowerQuery.length });
      pos += lowerQuery.length;
    }

    if (this.matchIndices.length > 0) {
      this.currentMatchIndex = 0;
      this.highlightMatch();
    } else {
      if (this.findCount) this.findCount.textContent = '0/0';
    }
  }

  nextMatch() {
    if (this.matchIndices.length === 0) return;
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matchIndices.length;
    this.highlightMatch();
  }

  prevMatch() {
    if (this.matchIndices.length === 0) return;
    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.matchIndices.length) % this.matchIndices.length;
    this.highlightMatch();
  }

  highlightMatch() {
    if (this.currentMatchIndex < 0 || this.currentMatchIndex >= this.matchIndices.length) return;
    const match = this.matchIndices[this.currentMatchIndex];
    if (this.findCount) {
      this.findCount.textContent = `${this.currentMatchIndex + 1}/${this.matchIndices.length}`;
    }

    this.textarea.focus();
    this.textarea.setSelectionRange(match.start, match.end);
  }

  resetFind() {
    this.matchIndices = [];
    this.currentMatchIndex = -1;
    if (this.findCount) this.findCount.textContent = '0/0';
    if (this.findInput) this.findInput.value = '';
  }
}
