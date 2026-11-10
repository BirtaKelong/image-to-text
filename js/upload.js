/**
 * Image & Document Upload Module
 */
import { showToast } from './notifications.js';

export class UploadManager {
  constructor(options = {}) {
    this.onImageReady = options.onImageReady || (() => {});
    this.onPdfReady = options.onPdfReady || (() => {});
    this.onClear = options.onClear || (() => {});

    this.dropzone = document.getElementById('dropzone');
    this.fileInput = document.getElementById('file-input');
    this.removeBtn = document.getElementById('btn-remove-image');
    this.replaceBtn = document.getElementById('btn-replace-image');

    this.currentFile = null;
    this.init();
  }

  init() {
    if (!this.dropzone || !this.fileInput) return;

    // Click to upload
    this.dropzone.addEventListener('click', () => {
      this.fileInput.value = '';
      this.fileInput.click();
    });

    if (this.replaceBtn) {
      this.replaceBtn.addEventListener('click', () => {
        this.fileInput.value = '';
        this.fileInput.click();
      });
    }

    if (this.removeBtn) {
      this.removeBtn.addEventListener('click', () => {
        this.clearFile();
      });
    }

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.processFile(file);
    });

    // Drag & Drop
    ['dragenter', 'dragover'].forEach((eventName) => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('dragover');
      });
    });

    this.dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) this.processFile(file);
    });

    // Window drag over styling
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      // If dropped outside dropzone, still accept if file is dropped
      if (!this.dropzone.contains(e.target)) {
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) {
          e.preventDefault();
          this.processFile(file);
        }
      }
    });
  }

  processFile(file) {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'pdf'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(ext) && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showToast(`Unsupported file format (.${ext}). Please upload JPG, PNG, WEBP, BMP, or PDF.`, 'error', 'Invalid File');
      return;
    }

    // 25MB limit
    if (file.size > 25 * 1024 * 1024) {
      showToast('File exceeds the 25 MB size limit.', 'error', 'File Too Large');
      return;
    }

    this.currentFile = file;

    if (file.type === 'application/pdf' || ext === 'pdf') {
      this.handlePdfFile(file);
    } else {
      this.handleImageFile(file);
    }
  }

  handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const fileData = {
          file,
          name: file.name,
          size: file.size,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          src: e.target.result,
          imageElement: img,
          isPdf: false,
        };
        this.onImageReady(fileData);
        showToast(`Loaded ${file.name} (${img.naturalWidth}×${img.naturalHeight}px)`, 'success', 'Image Uploaded');
      };
      img.onerror = () => {
        showToast('Failed to parse the image file.', 'error', 'Image Load Error');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      showToast('Failed to read the file.', 'error', 'File Error');
    };
    reader.readAsDataURL(file);
  }

  handlePdfFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const typedArray = new Uint8Array(e.target.result);
      const pdfData = {
        file,
        name: file.name,
        size: file.size,
        data: typedArray,
        isPdf: true,
      };
      this.onPdfReady(pdfData);
      showToast(`Loaded PDF: ${file.name}`, 'info', 'PDF Document Ready');
    };
    reader.onerror = () => {
      showToast('Failed to read PDF document.', 'error', 'File Error');
    };
    reader.readAsArrayBuffer(file);
  }

  loadFromDataUrl(dataUrl, name = 'sample-image.png', width = 800, height = 600) {
    const img = new Image();
    img.onload = () => {
      const fileData = {
        name,
        size: Math.round(dataUrl.length * 0.75),
        width: img.naturalWidth || width,
        height: img.naturalHeight || height,
        src: dataUrl,
        imageElement: img,
        isPdf: false,
      };
      this.onImageReady(fileData);
      showToast(`Loaded sample: ${name}`, 'success', 'Sample Ready');
    };
    img.src = dataUrl;
  }

  clearFile() {
    this.currentFile = null;
    if (this.fileInput) this.fileInput.value = '';
    this.onClear();
  }
}
