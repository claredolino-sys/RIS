import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export const exportRIStoPDF = (ris: any) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Appendix 63
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.text('Appendix 63', pageWidth - margin, 20, { align: 'right' });

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('REQUISITION AND ISSUE SLIP', pageWidth / 2, 30, { align: 'center' });
  
  // Header Details
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('Entity Name :', margin, 40);
  doc.text(ris.entity_name || '', margin + 22, 40);
  doc.setLineWidth(0.3);
  doc.line(margin + 20, 41, 105, 41);

  doc.setFont('times', 'bold');
  doc.text('Fund Cluster :', 120, 40);
  doc.setFont('times', 'normal');
  doc.text(ris.fund_cluster || '', 145, 40);
  doc.line(143, 41, pageWidth - margin, 41);

  // 1. Info Table (Division, Office, etc.)
  autoTable(doc, {
    startY: 45,
    margin: { left: margin, right: margin },
    tableWidth: 180,
    theme: 'grid',
    body: [
      [`Division : ${ris.division || ''}`, `Responsibility Center Code : ${ris.responsibility_center_code || ''}`],
      [`Office : ${ris.office || ''}`, `RIS No. : ${ris.ris_no || ''}`]
    ],
    styles: {
      font: 'times',
      fontSize: 10,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 90 }
    }
  });

  // 2. Items Table
  const minRows = 16; // Pad to ensure the form looks complete if few items
  const tableData = [];
  const items = ris.items || [];
  for (let i = 0; i < Math.max(minRows, items.length); i++) {
    const item = items[i] || {};
    tableData.push([
      item.stock_no || '',
      item.unit || '',
      item.description || '',
      item.quantity_requisition || '',
      item.stock_available_yes ? '✓' : '',
      item.stock_available_no ? '✓' : '',
      item.quantity_issue || '',
      item.remarks || ''
    ]);
  }

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left: margin, right: margin },
    tableWidth: 180,
    theme: 'grid',
    head: [
      [
        { content: 'Requisition', colSpan: 4, styles: { halign: 'center', fontStyle: 'bolditalic' } },
        { content: 'Stock Available?', colSpan: 2, styles: { halign: 'center', fontStyle: 'bolditalic' } },
        { content: 'Issue', colSpan: 2, styles: { halign: 'center', fontStyle: 'bolditalic' } }
      ],
      [
        { content: 'Stock No.', styles: { halign: 'center' } },
        { content: 'Unit', styles: { halign: 'center' } },
        { content: 'Description', styles: { halign: 'center' } },
        { content: 'Quantity', styles: { halign: 'center' } },
        { content: 'Yes', styles: { halign: 'center' } },
        { content: 'No', styles: { halign: 'center' } },
        { content: 'Quantity', styles: { halign: 'center' } },
        { content: 'Remarks', styles: { halign: 'center' } }
      ]
    ],
    body: tableData,
    styles: {
      font: 'times',
      fontSize: 10,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 2,
      minCellHeight: 7,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      fontStyle: 'normal'
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 15 },
      2: { cellWidth: 55 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 20 }
    }
  });

  // 3. Purpose Table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left: margin, right: margin },
    tableWidth: 180,
    theme: 'grid',
    body: [
      [{ content: `Purpose: ${ris.purpose || ''}`, styles: { minCellHeight: 15, valign: 'top' } }]
    ],
    styles: {
      font: 'times',
      fontSize: 10,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 2,
    }
  });

  // 4. Signatures Table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left: margin, right: margin },
    tableWidth: 180,
    theme: 'grid',
    head: [
      [
        { content: '', styles: { fillColor: [255, 255, 255] } },
        { content: 'Requested by:', styles: { fillColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'Approved by:', styles: { fillColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'Issued by:', styles: { fillColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'Received by:', styles: { fillColor: [255, 255, 255], fontStyle: 'bold' } }
      ]
    ],
    body: [
      [
        { content: 'Signature :', styles: { minCellHeight: 12, valign: 'bottom' } },
        '', '', '', ''
      ],
      [
        'Printed Name :',
        { content: ris.requested_by_name || ris.employee?.full_name || '', styles: { halign: 'center' } },
        { content: ris.approved_by_name || '', styles: { halign: 'center' } },
        { content: ris.issued_by_name || '', styles: { halign: 'center' } },
        { content: ris.received_by_name || '', styles: { halign: 'center' } }
      ],
      [
        'Designation :',
        { content: ris.requested_by_designation || ris.employee?.designation || '', styles: { halign: 'center' } },
        { content: ris.approved_by_designation || '', styles: { halign: 'center' } },
        { content: ris.issued_by_designation || '', styles: { halign: 'center' } },
        { content: ris.received_by_designation || '', styles: { halign: 'center' } }
      ],
      [
        'Date :',
        { content: ris.requested_by_date || '', styles: { halign: 'center' } },
        { content: ris.approved_by_date || '', styles: { halign: 'center' } },
        { content: ris.issued_by_date || '', styles: { halign: 'center' } },
        { content: ris.received_by_date || '', styles: { halign: 'center' } }
      ]
    ],
    styles: {
      font: 'times',
      fontSize: 10,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 2,
    },
    headStyles: {
      textColor: [0, 0, 0],
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 37.5 },
      2: { cellWidth: 37.5 },
      3: { cellWidth: 37.5 },
      4: { cellWidth: 37.5 }
    }
  });

  doc.save(`RIS_${ris.ris_no || ris.id}.pdf`);
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
