import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMonthName } from './dateHelpers';

export function generateBillPDF(entries, totals, providers, year, month, paymentInfo = { status: 'Pending', method: 'Cash' }) {
  const doc = new jsPDF();
  const monthName = getMonthName(month);

  // Constants
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [16, 185, 129]; // emerald-500
  const darkTextColor = [30, 41, 59];
  const lightTextColor = [100, 116, 139];

  // 1. Top Banner (Header)
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Hisaab', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Milk Delivery Tracking', 15, 32);
  
  // Invoice Text
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 14, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const invoiceId = `INV-${year}${month.toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  doc.text(`ID: ${invoiceId}`, pageWidth - 14, 32, { align: 'right' });

  // 2. Bill To & From
  let currentY = 55;
  
  // From Section (Provider)
  let provider = null;
  if (entries.length > 0) {
    const providerId = entries[0].providerId;
    provider = providers.find(p => p.id === providerId);
  }

  doc.setTextColor(...lightTextColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', 14, currentY);
  doc.text('BILL TO:', pageWidth / 2, currentY);

  currentY += 6;
  doc.setTextColor(...darkTextColor);
  doc.setFontSize(12);
  
  if (provider) {
    doc.text(provider.name, 14, currentY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (provider.contact) doc.text(`Phone: ${provider.contact}`, 14, currentY + 6);
    doc.text(`Rate: Rs. ${provider.ratePerLitre} / Litre`, 14, currentY + 12);
  } else {
    doc.text('Multiple Providers', 14, currentY);
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Valued Customer', pageWidth / 2, currentY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Billing Period: ${monthName} ${year}`, pageWidth / 2, currentY + 6);
  doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, currentY + 12);

  // 3. Table
  const tableData = entries.map(entry => {
    return [
      new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      entry.milk.morning.toString(),
      entry.milk.evening.toString(),
      (entry.milk.morning + entry.milk.evening).toFixed(1),
      `Rs. ${entry.milk.totalAmount.toFixed(2)}`,
      entry.newspaper.taken ? `Rs. ${entry.newspaper.rate.toFixed(2)}` : '-',
      `Rs. ${entry.totalAmount.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: 85,
    head: [['Date', 'Morning (L)', 'Evening (L)', 'Total (L)', 'Milk Amt', 'Paper Amt', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: darkTextColor,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [71, 85, 105], // slate-500
      lineColor: [226, 232, 240], // slate-200
      lineWidth: { bottom: 0.1 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold', textColor: darkTextColor },
    },
    margin: { left: 14, right: 14 }
  });

  // 4. Summary Box (Bottom Right)
  const finalY = doc.lastAutoTable.finalY + 15;
  const summaryX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setTextColor(...lightTextColor);
  doc.text('Total Milk:', summaryX, finalY);
  doc.setTextColor(...darkTextColor);
  doc.text(`${totals.totalMilk.toFixed(1)} L`, pageWidth - 14, finalY, { align: 'right' });

  doc.setTextColor(...lightTextColor);
  doc.text('Milk Amount:', summaryX, finalY + 8);
  doc.setTextColor(...darkTextColor);
  doc.text(`Rs. ${totals.totalMilkAmount.toFixed(2)}`, pageWidth - 14, finalY + 8, { align: 'right' });

  doc.setTextColor(...lightTextColor);
  doc.text('Paper Amount:', summaryX, finalY + 16);
  doc.setTextColor(...darkTextColor);
  doc.text(`Rs. ${totals.totalNewspaper.toFixed(2)}`, pageWidth - 14, finalY + 16, { align: 'right' });

  // Grand Total Box
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(summaryX - 5, finalY + 22, 75, 16, 2, 2, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Total Due:', summaryX + 2, finalY + 33);
  doc.text(`Rs. ${totals.totalAmount.toFixed(2)}`, pageWidth - 16, finalY + 33, { align: 'right' });

  // Additional Stats (Left side)
  doc.setFontSize(10);
  doc.setTextColor(...lightTextColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Delivery Summary:', 14, finalY);
  doc.setTextColor(...darkTextColor);
  doc.text(`Days Delivered: ${totals.daysDelivered}`, 14, finalY + 8);
  doc.text(`Days Missed: ${totals.daysMissed}`, 14, finalY + 16);

  // Payment Status Badge
  const paymentY = finalY + 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  if (paymentInfo.status === 'Paid') {
    doc.setFillColor(220, 252, 231); // green-100
    doc.setTextColor(22, 163, 74); // green-600
    doc.roundedRect(14, paymentY - 5, 55, 10, 2, 2, 'F');
    doc.text(`PAID via ${paymentInfo.method.toUpperCase()}`, 19, paymentY + 2);
  } else {
    doc.setFillColor(254, 226, 226); // red-100
    doc.setTextColor(220, 38, 38); // red-600
    doc.roundedRect(14, paymentY - 5, 40, 10, 2, 2, 'F');
    doc.text('PENDING', 24, paymentY + 2);
  }

  // 5. Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Save
  doc.save(`Hisaab_Invoice_${monthName}_${year}.pdf`);
}
