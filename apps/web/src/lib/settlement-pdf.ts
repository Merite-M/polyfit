import { jsPDF } from 'jspdf';
import { formatRwf } from './invoice-pdf';

export interface SettlementLineItem {
  org_name: string;
  category?: string;
  visit_count: number;
  per_visit_rate: number;
  subtotal: number;
}

export interface SettlementPdfData {
  id: string;
  statement_number?: string;
  period_start: string;
  period_end: string;
  total_visits: number;
  gross_amount: number;
  adjustments_amount?: number;
  platform_fee_amount?: number;
  net_amount: number;
  status: 'paid' | 'processing' | 'pending' | 'disputed';
  payout_date?: string;
  payment_reference?: string;
  created_at?: string;
  provider: {
    name: string;
    category?: string;
    tax_id?: string | null;
    settlement_email?: string | null;
    bank_details?: {
      payout_method?: string;
      bank_name?: string;
      account_name?: string;
      account_number?: string;
      swift_code?: string;
      momo_code?: string;
      momo_phone?: string;
    } | null;
  };
  line_items?: SettlementLineItem[];
}

export function generateSettlementPdf(
  statement: SettlementPdfData,
  options: { autoDownload?: boolean; previewInNewTab?: boolean } = { autoDownload: true }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Palette
  const colorNavy = [11, 31, 51] as const;       // #0B1F33
  const colorEmerald = [0, 109, 60] as const;    // #006D3C
  const colorSlate = [82, 97, 115] as const;     // #526173
  const colorLightBg = [247, 249, 252] as const; // #F7F9FC
  const colorBorder = [226, 232, 240] as const;  // #E2E8F0

  let currentY = margin;

  // Top Emerald Accent Ribbon
  doc.setFillColor(...colorEmerald);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Brand Header
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...colorEmerald);
  doc.text('PolyFit', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorSlate);
  doc.text('Corporate Wellness Network Ltd', margin + 28, currentY - 1);

  // Statement Title Right-Aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colorNavy);
  doc.text('SETTLEMENT STATEMENT / RELEVÉ DE RÈGLEMENT', pageWidth - margin, currentY, { align: 'right' });

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorSlate);
  doc.text('Kigali Heights, 4th Floor, KG 7 Ave, Kigali, Rwanda', margin, currentY);

  // Status Badge on Right
  const statusUpper = (statement.status || 'PENDING').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (statusUpper === 'PAID') {
    doc.setTextColor(22, 163, 74);
  } else if (statusUpper === 'DISPUTED') {
    doc.setTextColor(220, 38, 38);
  } else if (statusUpper === 'PROCESSING') {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(0, 90, 194);
  }
  doc.text(`STATUS: ${statusUpper}`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorSlate);
  doc.text('TIN: 102938475 | settlements@polyfit.rw | +250 788 123 456', margin, currentY);

  const statementNum =
    statement.statement_number || `PF-SET-${statement.id.substring(0, 8).toUpperCase()}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...colorNavy);
  doc.text(`STATEMENT #: ${statementNum}`, pageWidth - margin, currentY, { align: 'right' });

  // Divider
  currentY += 5;
  doc.setDrawColor(...colorBorder);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Beneficiary / Provider Details Block
  currentY += 6;
  const colWidth = contentWidth / 2 - 4;

  // Payee (Provider)
  doc.setFillColor(...colorLightBg);
  doc.roundedRect(margin, currentY, colWidth, 38, 2.5, 2.5, 'F');
  doc.setDrawColor(...colorBorder);
  doc.roundedRect(margin, currentY, colWidth, 38, 2.5, 2.5, 'D');

  let boxY = currentY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colorSlate);
  doc.text('PAYEE / WELLNESS PROVIDER:', margin + 4, boxY);

  boxY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...colorNavy);
  doc.text(statement.provider.name, margin + 4, boxY);

  boxY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorSlate);
  doc.text(`TIN (RRA): ${statement.provider.tax_id || 'Registered / On File'}`, margin + 4, boxY);

  boxY += 4;
  doc.text(`Email: ${statement.provider.settlement_email || 'finance@partner.rw'}`, margin + 4, boxY);

  boxY += 4;
  const bank = statement.provider.bank_details;
  let payoutDesc = 'Bank of Kigali (BK) ••••140-19';
  if (bank?.payout_method === 'momo') {
    payoutDesc = `MTN MoMo Code: ${bank.momo_code || '184920'}`;
  } else if (bank?.bank_name) {
    payoutDesc = `${bank.bank_name} • ${bank.account_number || ''}`;
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorEmerald);
  doc.text(`Payout Dest: ${payoutDesc}`, margin + 4, boxY);

  // Settlement Period & Terms Box (Right Column)
  const rightColX = margin + colWidth + 8;
  doc.setFillColor(...colorLightBg);
  doc.roundedRect(rightColX, currentY, colWidth, 38, 2.5, 2.5, 'F');
  doc.setDrawColor(...colorBorder);
  doc.roundedRect(rightColX, currentY, colWidth, 38, 2.5, 2.5, 'D');

  boxY = currentY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colorSlate);
  doc.text('SETTLEMENT CYCLE DETAILS:', rightColX + 4, boxY);

  boxY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorNavy);
  doc.text(`Period: ${statement.period_start} to ${statement.period_end}`, rightColX + 4, boxY);

  boxY += 4;
  doc.text(`Disbursement Date: ${statement.payout_date || '15th of the Month'}`, rightColX + 4, boxY);

  boxY += 4;
  doc.text(`Trace Reference: ${statement.payment_reference || 'BK-FT-20260915-082'}`, rightColX + 4, boxY);

  boxY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorSlate);
  doc.text(`Commercial Terms: Per Verified Visit Contract`, rightColX + 4, boxY);

  currentY += 44;

  // Key Financial Metric Highlights Strip
  const stripH = 16;
  doc.setFillColor(...colorNavy);
  doc.roundedRect(margin, currentY, contentWidth, stripH, 2.5, 2.5, 'F');

  const cellW = contentWidth / 4;
  const metrics = [
    { label: 'TOTAL VERIFIED VISITS', val: `${statement.total_visits} Visits` },
    { label: 'GROSS ACCRUED', val: formatRwf(statement.gross_amount) },
    { label: 'ADJUSTMENTS / FEES', val: formatRwf((statement.adjustments_amount || 0) + (statement.platform_fee_amount || 0)) },
    { label: 'NET SETTLEMENT PAYOUT', val: formatRwf(statement.net_amount) }
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * cellW + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(180, 195, 210);
    doc.text(m.label, x, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(m.val, x, currentY + 11.5);
  });

  currentY += stripH + 8;

  // Breakdown by Employer Organization Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colorNavy);
  doc.text('VISIT RECONCILIATION BY CLIENT ORGANIZATION', margin, currentY);

  currentY += 4;
  const tableHeaderH = 7;
  doc.setFillColor(...colorLightBg);
  doc.rect(margin, currentY, contentWidth, tableHeaderH, 'F');
  doc.setDrawColor(...colorBorder);
  doc.rect(margin, currentY, contentWidth, tableHeaderH, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...colorSlate);
  doc.text('ORGANIZATION / EMPLOYER', margin + 4, currentY + 4.8);
  doc.text('CATEGORY', margin + 70, currentY + 4.8);
  doc.text('VERIFIED VISITS', margin + 110, currentY + 4.8, { align: 'right' });
  doc.text('CONTRACT RATE', margin + 140, currentY + 4.8, { align: 'right' });
  doc.text('SUBTOTAL (RWF)', pageWidth - margin - 4, currentY + 4.8, { align: 'right' });

  currentY += tableHeaderH;

  const defaultLines: SettlementLineItem[] = [
    { org_name: 'Bank of Kigali Plc', category: 'Executive Fitness', visit_count: 205, per_visit_rate: 5000, subtotal: 1025000 },
    { org_name: 'MTN Rwandacell', category: 'Corporate All-Access', visit_count: 155, per_visit_rate: 5000, subtotal: 775000 },
    { org_name: 'TechCorp Rwanda', category: 'Standard Wellness', visit_count: 90, per_visit_rate: 5000, subtotal: 450000 },
    { org_name: 'I&M Bank Rwanda', category: 'Executive Fitness', visit_count: 40, per_visit_rate: 5000, subtotal: 200000 }
  ];

  const items = statement.line_items && statement.line_items.length > 0 ? statement.line_items : defaultLines;

  items.forEach((item, index) => {
    const rowH = 7;
    if (index % 2 === 1) {
      doc.setFillColor(252, 253, 254);
      doc.rect(margin, currentY, contentWidth, rowH, 'F');
    }
    doc.setDrawColor(...colorBorder);
    doc.line(margin, currentY + rowH, pageWidth - margin, currentY + rowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colorNavy);
    doc.text(item.org_name, margin + 4, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colorSlate);
    doc.text(item.category || 'General Access', margin + 70, currentY + 4.8);

    doc.text(`${item.visit_count}`, margin + 110, currentY + 4.8, { align: 'right' });
    doc.text(formatRwf(item.per_visit_rate), margin + 140, currentY + 4.8, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorNavy);
    doc.text(formatRwf(item.subtotal), pageWidth - margin - 4, currentY + 4.8, { align: 'right' });

    currentY += rowH;
  });

  // Totals Summary Block
  currentY += 4;
  const summaryBoxW = 75;
  const summaryBoxX = pageWidth - margin - summaryBoxW;

  const summaryLines = [
    { label: 'Gross Accrued Visits:', val: formatRwf(statement.gross_amount) },
    { label: 'Dispute Deductions / Adjustments:', val: formatRwf(statement.adjustments_amount || 0) },
    { label: 'PolyFit Platform Commission:', val: formatRwf(statement.platform_fee_amount || Math.round(statement.gross_amount * 0.1)) },
    { label: 'TOTAL NET PAYOUT (RWF):', val: formatRwf(statement.net_amount), bold: true, highlight: true }
  ];

  summaryLines.forEach((line) => {
    const rowH = 5.5;
    if (line.highlight) {
      doc.setFillColor(...colorEmerald);
      doc.roundedRect(summaryBoxX - 4, currentY, summaryBoxW + 4, rowH + 1, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...colorSlate);
    }

    doc.text(line.label, summaryBoxX, currentY + 4);
    doc.text(line.val, pageWidth - margin - 2, currentY + 4, { align: 'right' });

    currentY += rowH + 1;
  });

  // Footer & Fiscal Compliance Block
  currentY = 250;
  doc.setDrawColor(...colorBorder);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...colorNavy);
  doc.text('RWANDA TAX COMPLIANCE & SETTLEMENT DISBURSEMENT NOTICE', margin, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...colorSlate);
  doc.text(
    'This electronic settlement statement is issued pursuant to the PolyFit Wellness Network Partner Agreement. Payouts are reconciled via electronic funds transfer (EFT) or Mobile Money Merchant rails directly into the registered provider account. All visit records have been audited with anti-passback and geofence verification.',
    margin,
    currentY,
    { maxWidth: contentWidth }
  );

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorEmerald);
  doc.text('Certified by PolyFit Finance & Settlement Engine • Kigali, Rwanda', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colorSlate);
  doc.text(`Generated on ${new Date().toISOString().split('T')[0]} • Page 1 of 1`, pageWidth - margin, currentY, {
    align: 'right'
  });

  if (options.autoDownload && typeof window !== 'undefined') {
    doc.save(`${statementNum}.pdf`);
  }

  return doc;
}
