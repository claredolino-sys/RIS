import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId: string, filename = 'document.pdf') => {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Element not found: ' + elementId);

  const wasHidden = el.style.display === 'none';
  if (wasHidden) {
    el.style.display = 'block';
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    el.style.left = '-9999px';
  }

  await new Promise(r => setTimeout(r, 150));

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData  = canvas.toDataURL('image/png');
    const pdf      = new jsPDF('p', 'mm', 'a4');
    const margin   = 15;
    const pageW    = 210;
    const pageH    = 297;
    const imgW     = pageW - margin * 2;
    const imgH     = (canvas.height * imgW) / canvas.width;
    const maxH     = pageH - margin * 2;

    if (imgH <= maxH) {
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
    } else {
      const scale  = maxH / imgH;
      pdf.addImage(imgData, 'PNG', margin, margin, imgW * scale, imgH * scale);
    }

    pdf.save(filename);
  } finally {
    if (wasHidden) {
      el.style.display = 'none';
      el.style.position = '';
      el.style.top = '';
      el.style.left = '';
    }
  }
};

export const printElement = (elementId: string, title = 'Print') => {
  const el = document.getElementById(elementId);
  if (!el) return;
  const w = window.open('', '_blank', 'width=950,height=800');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; padding: 15mm; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid black; }
    @page { size: A4 portrait; margin: 15mm; }
  </style></head><body>${el.innerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
};

export const safeName = (str = '') => str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
