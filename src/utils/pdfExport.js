import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDFReport = (providers, entries, monthlyPayments) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.text('Hisaab Monthly Summary', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`Generated on: ${dateStr}`, pageWidth / 2, 22, { align: 'center' });
  
  let currentY = 30;

  // ── Monthly Totals Calculation ──
  // Group entries by provider and month
  const monthlyTotals = {};

  entries.forEach(e => {
    const pId = e.provider_id || e.providerId;
    if (!pId) return;

    const dateObj = new Date(e.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth(); // 0-indexed to match app's payment key format
    const amount = parseFloat(e.total_amount || e.totalAmount || 0);

    const key = `${pId}_${year}_${month}`;
    if (!monthlyTotals[key]) {
      monthlyTotals[key] = {
        providerId: pId,
        year: year,
        month: month,
        totalAmount: 0
      };
    }
    monthlyTotals[key].totalAmount += amount;
  });

  // Check if we have any data
  if (Object.keys(monthlyTotals).length === 0) {
    doc.setFontSize(12);
    doc.text("No billing data found.", 14, currentY);
    doc.save(`Hisaab_Monthly_Summary_${dateStr}.pdf`);
    return;
  }

  // ── Monthly Summary Table ──
  doc.setFontSize(14);
  doc.text('Monthly Billing Summary', 14, currentY);
  currentY += 5;

  const summaryRows = [];

  for (const [key, data] of Object.entries(monthlyTotals)) {
    const providerName = providers.find(p => p.id === data.providerId)?.name || 'Unknown';
    const monthName = new Date(data.year, data.month).toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Check if paid in monthlyPayments
    const paymentRecord = monthlyPayments[key] || {};
    const status = paymentRecord.status || 'Pending';
    const method = paymentRecord.method || paymentRecord.payment_method || '-';

    // We store year and month in the row temporarily for sorting, then we will remove it
    summaryRows.push({
      year: data.year,
      month: data.month,
      rowData: [
        monthName,
        providerName,
        `Rs. ${data.totalAmount.toFixed(2)}`,
        status,
        method
      ]
    });
  }

  // Sort by Year descending, then Month descending
  summaryRows.sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });

  // Extract the rowData for autoTable
  const finalTableBody = summaryRows.map(row => row.rowData);

  autoTable(doc, {
    startY: currentY,
    head: [['Month', 'Provider', 'Total Amount', 'Status', 'Method']],
    body: finalTableBody,
    theme: 'striped',
    headStyles: { fillColor: [15, 118, 110] }, // Tailwind teal-700
    margin: { top: 10 },
  });

  // Save the PDF
  const filenameDate = new Date().toISOString().slice(0, 10);
  doc.save(`Hisaab_Monthly_Summary_${filenameDate}.pdf`);
};
