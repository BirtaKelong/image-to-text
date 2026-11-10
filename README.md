# Image to Text Converter (Professional Client-Side OCR Web Application)

A modern, responsive, high-performance **Image to Text Converter (OCR Tool)** built using HTML5, CSS3, and Vanilla JavaScript (ES6+). The application processes images and PDF documents entirely inside the user's web browser using WebAssembly and Web Workers, with zero server uploads, cloud APIs, or paid subscriptions.

---

## 🚀 Key Features

- **100% Client-Side Architecture**: Complete data privacy. Images and documents are processed locally; nothing is sent to any external server.
- **Multilingual OCR Engine**: Powered by **Tesseract.js** (v5) with support for:
  - **English** (`eng`, Latin script)
  - **Hindi** (`hin`, Devanagari script)
  - **Bengali** (`ben`, Bangla script)
  - **Assamese** (`asm`, Asamiya script)
  - Spanish (`spa`), French (`fra`), German (`deu`), Arabic (`ara`), Chinese (`chi_sim`), Japanese (`jpn`).
- **Interactive Image Editing Studio**:
  - Image Cropping powered by **Cropper.js**
  - Clockwise Rotation (90°, 180°, 270°) with automatic aspect-ratio calculation
  - Zoom Controls (+ and -)
  - Real-Time Brightness & Contrast adjustment filters
  - One-click reset to original state
  - *Edits are automatically baked into an offscreen canvas for OCR recognition*.
- **PDF Document Processing**:
  - Multi-page PDF ingestion using **PDF.js**
  - High-resolution (2.0x scale) canvas rendering for crisp OCR
  - Page-by-page navigation controls
  - Fast embedded digital text extraction without OCR overhead when available.
- **Integrated Text Editor**:
  - Real-time word counter, character counter, non-whitespace character counter, and line counter.
  - Estimated reading time calculation.
  - In-text search and navigation (Find / Next / Previous match highlighting).
  - One-click Copy to Clipboard with fallback.
  - Safe Clear Text with confirmation modal.
- **Multi-Format Export**:
  - **TXT**: Plain text with UTF-8 BOM for full Unicode/Indic script support in Windows Notepad and Mac TextEdit.
  - **PDF**: Multi-page formatted PDF export generated using **jsPDF** with document headers, metadata, and page numbers.
  - **DOCX**: Formatted Microsoft Word `.docx` documents generated using the **docx** library.
- **Modern SaaS UI / UX**:
  - Clean two-column desktop workspace with responsive vertical mobile flow.
  - Theme Switcher (Light & Dark modes) persisted via `localStorage` with system preference detection.
  - Floating toast notifications for real-time user feedback.
  - Built-in sample generator (Sample Invoice & Multilingual specimen) for 1-click evaluation.

---

## 📁 Project Architecture & Folder Structure

```
image-to-text/
│
├── index.html              # Semantic HTML5 layout and CDN library inclusions
│
├── css/
│   ├── themes.css          # CSS custom properties for Light and Dark themes
│   ├── style.css           # Core SaaS layout, toolbars, editor, modals, toasts
│   └── responsive.css      # Tablet and mobile viewport breakpoints
│
├── js/
│   ├── app.js              # Application coordinator & event bindings
│   ├── upload.js           # Drag-and-drop, file input, and file validation
│   ├── image-editor.js     # Cropper.js, rotation, zoom, brightness, contrast
│   ├── ocr.js              # Tesseract.js worker management & multilingual OCR
│   ├── pdf-reader.js       # PDF.js document reading & page rendering
│   ├── text-editor.js      # Textarea editor, real-time counters, search/find
│   ├── export.js           # TXT, jsPDF, and docx file generators
│   ├── notifications.js    # Toast notification system
│   └── samples.js          # Built-in sample invoice & multilingual canvas generator
│
├── src/
│   └── utils/
│       ├── textStats.ts         # Pure text statistics logic (multilingual word counts)
│       ├── textStats.test.ts    # Node:test unit tests
│       ├── formatters.ts        # Byte sizes, dimensions, and filename sanitizer
│       └── formatters.test.ts   # Node:test unit tests
│
└── README.md               # Documentation and setup instructions
```

---

## 📦 Technology Stack & Libraries

| Technology | Purpose | Distribution |
| :--- | :--- | :--- |
| **HTML5 & CSS3** | Application structure, design variables, and layout | Native |
| **Vanilla JavaScript (ES6+)**| Modular application logic | Native ES Modules |
| **Tesseract.js** (v5) | Optical Character Recognition via WebAssembly & Web Workers | CDN (jsdelivr) |
| **Cropper.js** (v1.6) | Interactive image cropping | CDN (cdnjs) |
| **PDF.js** (v3.11) | PDF document parsing & canvas rendering | CDN (cdnjs) |
| **jsPDF** (v2.5) | Client-side PDF generation | CDN (cdnjs) |
| **docx** (v8.5) | Client-side Microsoft Word `.docx` generation | CDN (jsdelivr) |
| **FileSaver.js** (v2.0) | File downloading & Blob preservation | CDN (cdnjs) |
| **Google Fonts** | Plus Jakarta Sans & JetBrains Mono typography | Google Fonts CDN |
| **Lucide Icons** | Interface iconography | CDN (unpkg) |

---

## 💻 Instructions to Run Locally

### Option 1: Standard Static HTTP Server (No Build Step Required)
Because the application uses native HTML5, CSS3, and ES6 modules, it can be served with any static web server:

```bash
# Using Python 3:
python3 -m http.server 3000

# OR using Node.js npx serve:
npx serve . -p 3000
```
Open `http://localhost:3000` in your web browser.

### Option 2: Using the Development Dev Server (Vite)
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test # or npx tsx --test src/utils/textStats.test.ts src/utils/formatters.test.ts

# 3. Start development server
npm run dev

# 4. Build production bundle
npm run build
```

---

## 🌐 Browser Compatibility

| Browser | Minimum Version | Notes |
| :--- | :--- | :--- |
| **Google Chrome / Chromium** | 80+ | Full support (SIMD WebAssembly acceleration enabled) |
| **Mozilla Firefox** | 78+ | Full support |
| **Apple Safari** | 14.1+ | Full support |
| **Microsoft Edge** | 80+ | Full support |
| **Mobile Browsers** (Chrome, Safari, Firefox) | Modern | Fully responsive UI with touch gesture cropping |

---

## ✅ Quality & Testing Checklist

- [x] **File Validation**: Rejects invalid file types and files larger than 25 MB with user-friendly toast messages.
- [x] **Image Upload**: Supports JPG, JPEG, PNG, WEBP, BMP via file dialog and drag-and-drop.
- [x] **Image Cropping**: Cropper.js handles freeform crop box, with "Apply Crop" and "Cancel Crop" actions.
- [x] **Image Rotation**: Rotates 90°, 180°, and 270° clockwise with coordinate translation.
- [x] **Adjustments**: Live preview and canvas baking of Brightness (-50% to +50%) and Contrast (-50% to +50%).
- [x] **PDF Document Support**: Ingests multi-page PDFs, renders at 2.0x DPI scale, supports page flipping and digital text extraction.
- [x] **Multilingual OCR**:
  - English (`eng`)
  - Hindi (`hin`, Devanagari script)
  - Bengali (`ben`, Bangla script)
  - Assamese (`asm`, Asamiya script)
- [x] **Real-Time OCR Progress**: Live percentage (0–100%) and stage descriptions with cancellation support.
- [x] **Text Editor**: Live word, character, and line count computation supporting Indic script combining marks.
- [x] **In-Text Search**: Find search query with match counter and navigation controls.
- [x] **File Exports**:
  - `.txt` download with UTF-8 BOM
  - `.pdf` multi-page styled document with headers and page footers
  - `.docx` Microsoft Word document
- [x] **Privacy**: Zero external network requests for user image data.
- [x] **Themes**: Dark and Light theme toggle persisted in `localStorage`.
