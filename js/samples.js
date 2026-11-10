/**
 * Sample Image Generators
 * Generates realistic document canvases for 1-click testing.
 */

export function generateSampleInvoice() {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 900, 700);

  // Border & subtle paper texture
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 860, 660);

  // Header band
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(40, 40, 820, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('GLOBAL TECH SOLUTIONS INC.', 60, 85);
  ctx.font = '14px sans-serif';
  ctx.fillText('INVOICE #INV-2026-8942  |  DATE: NOVEMBER 10, 2026', 60, 103);

  // Bill To
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('BILLED TO:', 60, 160);
  ctx.font = '14px sans-serif';
  ctx.fillText('Acme Corporation', 60, 185);
  ctx.fillText('100 Innovation Way, Suite 400', 60, 205);
  ctx.fillText('San Francisco, CA 94107', 60, 225);

  // Payment Info
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('PAYMENT DETAILS:', 520, 160);
  ctx.font = '14px sans-serif';
  ctx.fillText('Due Date: December 10, 2026', 520, 185);
  ctx.fillText('Payment Method: Wire Transfer', 520, 205);
  ctx.fillText('Status: PAYMENT PENDING', 520, 225);

  // Table header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(60, 260, 780, 40);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('DESCRIPTION', 80, 285);
  ctx.fillText('QTY', 480, 285);
  ctx.fillText('UNIT PRICE', 580, 285);
  ctx.fillText('AMOUNT', 740, 285);

  // Table rows
  const items = [
    { desc: 'Cloud Vision OCR Pipeline License', qty: '1', rate: '$1,200.00', amount: '$1,200.00' },
    { desc: 'Frontend Document Scanning Module', qty: '40 hrs', rate: '$120.00', amount: '$4,800.00' },
    { desc: 'Neural Tesseract Language Pack Setup', qty: '1', rate: '$650.00', amount: '$650.00' },
    { desc: 'Client Data Privacy & Client-Side Verification', qty: '1', rate: '$450.00', amount: '$450.00' },
  ];

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#334155';
  let y = 330;
  items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(60, y - 22, 780, 34);
      ctx.fillStyle = '#334155';
    }
    ctx.fillText(item.desc, 80, y);
    ctx.fillText(item.qty, 480, y);
    ctx.fillText(item.rate, 580, y);
    ctx.fillText(item.amount, 740, y);
    y += 40;
  });

  // Total
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(520, y);
  ctx.lineTo(840, y);
  ctx.stroke();

  y += 30;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('TOTAL DUE:', 580, y);
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('$7,100.00', 730, y);

  // Note
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 12px sans-serif';
  ctx.fillText('Thank you for your business. All OCR data is processed locally.', 60, 640);

  return canvas.toDataURL('image/png');
}

export function generateSampleMultilingual() {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 900, 700);

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 840, 640);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Multilingual OCR Recognition Test', 60, 80);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('This document contains English, Hindi, Bengali, and Assamese text.', 60, 110);

  // English Section
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('1. English (Latin Script):', 60, 160);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Knowledge is power. Information is liberating.', 60, 195);
  ctx.fillText('Education is the premise of progress in every society.', 60, 220);

  // Hindi Section
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('2. Hindi (Devanagari Script):', 60, 280);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('सत्यमेव जयते। ज्ञान ही शक्ति है।', 60, 315);
  ctx.fillText('परिश्रम ही सफलता की कुंजी है।', 60, 345);

  // Bengali Section
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('3. Bengali (Bangla Script):', 60, 405);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('সবার উপরে মানুষ সত্য তাহার উপরে নাই।', 60, 440);
  ctx.fillText('জ্ঞান হলো আলোর মতো যা অন্ধকার দূর করে।', 60, 470);

  // Assamese Section
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('4. Assamese (Asamiya Script):', 60, 530);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('অসম আমাৰ ৰূপহী গুণৰ নাই শেষ।', 60, 565);
  ctx.fillText('পঢ়িলেহে জ্ঞান বাঢ়ে আৰু জীৱন সফল হয়।', 60, 595);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('Local In-Browser Optical Character Recognition System', 60, 645);

  return canvas.toDataURL('image/png');
}
