/**
 * Export & Download Module (TXT, PDF with jsPDF, DOCX with docx library)
 */
import { showToast } from './notifications.js';

export class ExportManager {
  constructor(options = {}) {
    this.getText = options.getText || (() => '');
    this.getSourceFileName = options.getSourceFileName || (() => 'extracted-text');

    this.txtBtn = document.getElementById('btn-download-txt');
    this.pdfBtn = document.getElementById('btn-download-pdf');
    this.docxBtn = document.getElementById('btn-download-docx');

    this.init();
  }

  init() {
    if (this.txtBtn) {
      this.txtBtn.addEventListener('click', () => this.exportTxt());
    }

    if (this.pdfBtn) {
      this.pdfBtn.addEventListener('click', () => this.exportPdf());
    }

    if (this.docxBtn) {
      this.docxBtn.addEventListener('click', () => this.exportDocx());
    }
  }

  getBaseFileName() {
    const rawName = this.getSourceFileName();
    const clean = rawName
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/[^\w\s\u0900-\u097F\u0980-\u09FF-]/gi, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 40);

    const dateStr = new Date().toISOString().slice(0, 10);
    return clean ? `ocr_${clean}_${dateStr}` : `ocr_extracted_${dateStr}`;
  }

  saveFileBlob(blob, filename) {
    if (window.saveAs) {
      window.saveAs(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
    }
  }

  /**
   * Export as Plain Text (.txt)
   */
  exportTxt() {
    const text = this.getText();
    if (!text.trim()) {
      showToast('No text to export.', 'warning');
      return;
    }

    try {
      const filename = `${this.getBaseFileName()}.txt`;
      // Include UTF-8 BOM so Notepad and other editors properly recognize Indic/Unicode characters
      const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });
      this.saveFileBlob(blob, filename);
      showToast(`Exported ${filename}`, 'success', 'TXT Downloaded');
    } catch (err) {
      console.error('TXT export error:', err);
      showToast('Failed to export TXT file.', 'error');
    }
  }

  /**
   * Export as PDF Document (.pdf) using jsPDF
   */
  exportPdf() {
    const text = this.getText();
    if (!text.trim()) {
      showToast('No text to export.', 'warning');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('PDF generation library is not loaded.', 'error');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 45;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = margin + 20;

      // Header Banner
      doc.setFillColor(99, 102, 241); // Indigo
      doc.rect(margin, margin - 15, contentWidth, 3, 'F');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text('OCR Extracted Document', margin, cursorY);
      cursorY += 16;

      // Metadata subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const timestamp = new Date().toLocaleString();
      const sourceName = this.getSourceFileName();
      doc.text(`Source: ${sourceName}  •  Exported: ${timestamp}`, margin, cursorY);
      cursorY += 20;

      // Content divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(margin, cursorY, margin + contentWidth, cursorY);
      cursorY += 20;

      // Body text configuration
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);

      // Split text into lines that fit the page width
      const paragraphs = text.split(/\r\n|\r|\n/);
      let pageNumber = 1;

      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
          cursorY += 12; // paragraph spacing
          continue;
        }

        const lines = doc.splitTextToSize(paragraph, contentWidth);

        for (const line of lines) {
          if (cursorY + 16 > pageHeight - margin) {
            // Add page number footer before adding new page
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - margin + 15, { align: 'center' });

            doc.addPage();
            pageNumber++;
            cursorY = margin + 20;

            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
          }

          doc.text(line, margin, cursorY);
          cursorY += 16;
        }

        cursorY += 6; // Spacing after paragraph
      }

      // Final page footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - margin + 15, { align: 'center' });

      const filename = `${this.getBaseFileName()}.pdf`;
      doc.save(filename);
      showToast(`Exported ${filename}`, 'success', 'PDF Downloaded');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast(`Failed to generate PDF: ${err.message}`, 'error', 'Export Failed');
    }
  }

  /**
   * Export as Word Document (.docx) using docx library
   */
  async exportDocx() {
    const text = this.getText();
    if (!text.trim()) {
      showToast('No text to export.', 'warning');
      return;
    }

    if (!window.docx) {
      showToast('Word export library is not ready.', 'error');
      return;
    }

    try {
      showToast('Generating Microsoft Word document...', 'info');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = window.docx;

      const paragraphs = text.split(/\r\n|\r|\n/);
      const docChildren = [
        new Paragraph({
          text: 'OCR Extracted Text',
          heading: HeadingLevel.TITLE,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Source Document: ${this.getSourceFileName()}`,
              italics: true,
              size: 18, // 9pt
              color: '64748B',
            }),
            new TextRun({
              text: `  |  Generated: ${new Date().toLocaleString()}`,
              italics: true,
              size: 18,
              color: '64748B',
            }),
          ],
          spacing: { after: 300 },
        }),
      ];

      // Add each paragraph of text
      for (const p of paragraphs) {
        if (!p.trim()) {
          docChildren.push(new Paragraph({ text: '', spacing: { after: 100 } }));
        } else {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: p,
                  size: 22, // 11pt
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 140, line: 320 },
            })
          );
        }
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const filename = `${this.getBaseFileName()}.docx`;
      this.saveFileBlob(blob, filename);
      showToast(`Exported ${filename}`, 'success', 'DOCX Downloaded');
    } catch (err) {
      console.error('DOCX export error:', err);
      showToast(`Failed to export DOCX: ${err.message}`, 'error');
    }
  }
}
