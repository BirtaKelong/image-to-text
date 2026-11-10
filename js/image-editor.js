/**
 * Image Editor Module (Cropper.js, Rotation, Zoom, Brightness, Contrast)
 */
import { showToast } from './notifications.js';

export class ImageEditor {
  constructor(options = {}) {
    this.onDimensionsChange = options.onDimensionsChange || (() => {});
    
    this.imageElement = document.getElementById('preview-image');
    this.viewport = document.getElementById('image-viewport');
    this.cropActionBar = document.getElementById('crop-actions-bar');
    
    // Sliders
    this.brightnessSlider = document.getElementById('slider-brightness');
    this.contrastSlider = document.getElementById('slider-contrast');
    this.brightnessVal = document.getElementById('val-brightness');
    this.contrastVal = document.getElementById('val-contrast');
    
    // State
    this.originalSrc = null;
    this.currentSrc = null;
    this.rotation = 0; // 0, 90, 180, 270
    this.zoomScale = 1;
    this.brightness = 0; // -50 to 50
    this.contrast = 0;   // -50 to 50
    this.cropper = null;
    this.isCropping = false;

    this.init();
  }

  init() {
    if (this.brightnessSlider) {
      this.brightnessSlider.addEventListener('input', (e) => {
        this.brightness = parseInt(e.target.value, 10) || 0;
        if (this.brightnessVal) this.brightnessVal.textContent = `${this.brightness > 0 ? '+' : ''}${this.brightness}%`;
        this.updatePreviewTransform();
      });
    }

    if (this.contrastSlider) {
      this.contrastSlider.addEventListener('input', (e) => {
        this.contrast = parseInt(e.target.value, 10) || 0;
        if (this.contrastVal) this.contrastVal.textContent = `${this.contrast > 0 ? '+' : ''}${this.contrast}%`;
        this.updatePreviewTransform();
      });
    }

    // Crop action buttons
    const confirmCropBtn = document.getElementById('btn-confirm-crop');
    const cancelCropBtn = document.getElementById('btn-cancel-crop');

    if (confirmCropBtn) {
      confirmCropBtn.addEventListener('click', () => this.applyCrop());
    }

    if (cancelCropBtn) {
      cancelCropBtn.addEventListener('click', () => this.cancelCrop());
    }
  }

  loadImage(src, width, height) {
    this.destroyCropper();
    this.originalSrc = src;
    this.currentSrc = src;
    this.rotation = 0;
    this.zoomScale = 1;
    this.brightness = 0;
    this.contrast = 0;
    this.isCropping = false;

    if (this.brightnessSlider) this.brightnessSlider.value = 0;
    if (this.contrastSlider) this.contrastSlider.value = 0;
    if (this.brightnessVal) this.brightnessVal.textContent = '0%';
    if (this.contrastVal) this.contrastVal.textContent = '0%';

    if (this.imageElement) {
      this.imageElement.src = src;
      this.imageElement.onload = () => {
        this.onDimensionsChange(this.imageElement.naturalWidth, this.imageElement.naturalHeight);
      };
    }
    this.updatePreviewTransform();
  }

  updatePreviewTransform() {
    if (!this.imageElement || this.isCropping) return;

    // Apply rotation and zoom
    this.imageElement.style.transform = `scale(${this.zoomScale}) rotate(${this.rotation}deg)`;

    // Apply brightness and contrast filters
    // brightness(1 + b/100), contrast(1 + c/100)
    const bVal = 1 + (this.brightness / 100);
    const cVal = 1 + (this.contrast / 100);
    this.imageElement.style.filter = `brightness(${bVal}) contrast(${cVal})`;
  }

  rotate() {
    if (this.isCropping) {
      if (this.cropper) this.cropper.rotate(90);
      return;
    }
    this.rotation = (this.rotation + 90) % 360;
    this.updatePreviewTransform();
  }

  zoomIn() {
    if (this.isCropping) {
      if (this.cropper) this.cropper.zoom(0.1);
      return;
    }
    this.zoomScale = Math.min(3.0, +(this.zoomScale + 0.15).toFixed(2));
    this.updatePreviewTransform();
  }

  zoomOut() {
    if (this.isCropping) {
      if (this.cropper) this.cropper.zoom(-0.1);
      return;
    }
    this.zoomScale = Math.max(0.4, +(this.zoomScale - 0.15).toFixed(2));
    this.updatePreviewTransform();
  }

  toggleCrop() {
    if (this.isCropping) {
      this.cancelCrop();
    } else {
      this.startCrop();
    }
  }

  startCrop() {
    if (!this.imageElement || !window.Cropper) {
      showToast('Cropper library not available.', 'error');
      return;
    }

    this.isCropping = true;
    if (this.cropActionBar) this.cropActionBar.classList.add('active');

    // Reset temporary CSS transform during cropper session
    this.imageElement.style.transform = '';

    this.cropper = new window.Cropper(this.imageElement, {
      viewMode: 1,
      dragMode: 'crop',
      autoCropArea: 0.85,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready: () => {
        if (this.rotation !== 0) {
          this.cropper.rotateTo(this.rotation);
        }
      },
    });

    const cropBtn = document.getElementById('btn-tool-crop');
    if (cropBtn) cropBtn.classList.add('active');
  }

  applyCrop() {
    if (!this.cropper) return;

    const canvas = this.cropper.getCroppedCanvas({
      maxWidth: 4096,
      maxHeight: 4096,
      fillColor: '#ffffff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    if (canvas) {
      const croppedDataUrl = canvas.toDataURL('image/png');
      this.destroyCropper();
      this.currentSrc = croppedDataUrl;
      this.rotation = 0; // reset rotation since cropped canvas already has rotation baked in
      this.imageElement.src = croppedDataUrl;
      this.updatePreviewTransform();
      this.onDimensionsChange(canvas.width, canvas.height);
      showToast(`Cropped to ${canvas.width}×${canvas.height}px`, 'success', 'Crop Applied');
    } else {
      this.cancelCrop();
    }
  }

  cancelCrop() {
    this.destroyCropper();
    this.updatePreviewTransform();
  }

  destroyCropper() {
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    this.isCropping = false;
    if (this.cropActionBar) this.cropActionBar.classList.remove('active');

    const cropBtn = document.getElementById('btn-tool-crop');
    if (cropBtn) cropBtn.classList.remove('active');
  }

  reset() {
    this.destroyCropper();
    if (this.originalSrc) {
      this.currentSrc = this.originalSrc;
      this.imageElement.src = this.originalSrc;
    }
    this.rotation = 0;
    this.zoomScale = 1;
    this.brightness = 0;
    this.contrast = 0;

    if (this.brightnessSlider) this.brightnessSlider.value = 0;
    if (this.contrastSlider) this.contrastSlider.value = 0;
    if (this.brightnessVal) this.brightnessVal.textContent = '0%';
    if (this.contrastVal) this.contrastVal.textContent = '0%';

    this.updatePreviewTransform();
    if (this.imageElement) {
      this.onDimensionsChange(this.imageElement.naturalWidth, this.imageElement.naturalHeight);
    }
    showToast('Image edits reset to original.', 'info');
  }

  /**
   * Generates a processed canvas with rotation, brightness, and contrast baked in.
   * This is passed to Tesseract.js for high-accuracy OCR.
   */
  async getProcessedCanvas() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const rad = (this.rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));

        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        // Bounding box size after rotation
        const newWidth = Math.round(originalWidth * cos + originalHeight * sin);
        const newHeight = Math.round(originalWidth * sin + originalHeight * cos);

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to create canvas context'));
        }

        // Fill background with white for clean contrast
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);

        // Apply filters
        const bVal = 1 + (this.brightness / 100);
        const cVal = 1 + (this.contrast / 100);
        ctx.filter = `brightness(${bVal}) contrast(${cVal})`;

        // Transform for rotation around center
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -originalWidth / 2, -originalHeight / 2);

        resolve(canvas);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = this.currentSrc;
    });
  }
}
