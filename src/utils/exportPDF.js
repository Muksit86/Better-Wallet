import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// helpers

const fitText = (doc, text, maxWidth, startSize = 12) => {
  let size = startSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidth && size > 6) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
};

const rrect = (doc, x, y, w, h, r, fill, stroke = null) => {
  doc.setFillColor(...fill);
  if (stroke) doc.setDrawColor(...stroke);
  doc.roundedRect(x, y, w, h, r, r, stroke ? "FD" : "F");
};

// Format number with plain en-US commas
const fmt = (n) => Number(n).toLocaleString("en-US");

// main 

const exportPDF = (expenses) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2; // 182 mm

  // palette 
  const NAVY = [15, 23, 42];
  const ACCENT = [29, 177, 195];
  const ACCENT_D = [24, 160, 177];
  const SL100 = [241, 245, 249];
  const SL200 = [226, 232, 240];
  const SL400 = [148, 163, 184];
  const SL500 = [100, 116, 139];
  const SL800 = [30, 41, 59];
  const WHITE = [255, 255, 255];

  // calculations
  const total = expenses.reduce((a, e) => a + Number(e.amount), 0);

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // HEADER
  const H_PAD_T = 12;
  const H_PAD_B = 12;
  const NL_H = 8; 
  const SL_H = 5.5; // subtitle line-height

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize("Expense Report", CONTENT_W - 2);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const subLines = doc.splitTextToSize("All Transactions Overview", CONTENT_W);

  const headerH =
    H_PAD_T + titleLines.length * NL_H + 3 + subLines.length * SL_H + H_PAD_B;

  // Background
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, headerH, "F");

  // Top accent bar
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, PAGE_W, 2.5, "F");

  // Title
  let ny = H_PAD_T + NL_H;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  titleLines.forEach((ln) => {
    doc.text(ln, MARGIN, ny);
    ny += NL_H;
  });

  // Subtitle left + date right — same line
  ny += 1;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SL400);
  subLines.forEach((ln, i) => {
    doc.text(ln, MARGIN, ny);
    if (i === 0) {
      doc.text(`Generated: ${currentDate}`, PAGE_W - MARGIN, ny, {
        align: "right",
      });
    }
    ny += SL_H;
  });

  // 2. STATS CARDS — 2 cards
  const CARD_GAP = 4;
  const CARD_W = (CONTENT_W - CARD_GAP) / 2; // 2 cards
  const CARD_H = 28;
  const CARDS_Y = headerH + 10;

  const cards = [
    { label: "TOTAL EXPENSES", value: String(expenses.length), color: ACCENT },
    { label: "TOTAL AMOUNT", value: `Rs. ${fmt(total)}`, color: SL800 },
  ];

  cards.forEach((card, i) => {
    const cx = MARGIN + i * (CARD_W + CARD_GAP);

    // Card bg
    rrect(doc, cx, CARDS_Y, CARD_W, CARD_H, 3, SL100, SL200);

    // Left accent bar
    doc.setFillColor(...card.color);
    doc.roundedRect(cx, CARDS_Y, 2.5, CARD_H, 1, 1, "F");

    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SL500);
    doc.text(card.label, cx + 5.5, CARDS_Y + 8);

    // Value — auto-shrink to fit
    const maxW = CARD_W - 8;
    fitText(doc, card.value, maxW, 10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...card.color);
    doc.text(card.value, cx + 5.5, CARDS_Y + 21);
  });

  // 3. TRANSACTIONS TABLE
  const TABLE_Y = CARDS_Y + CARD_H + 12;

  // Section heading
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SL800);
  doc.text("TRANSACTIONS", MARGIN, TABLE_Y);

  doc.setDrawColor(...SL200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, TABLE_Y + 2.5, PAGE_W - MARGIN, TABLE_Y + 2.5);

  autoTable(doc, {
    startY: TABLE_Y + 6,
    head: [["#", "Expense", "Amount", "Date"]],
    body: [...expenses]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((e, idx) => [
        idx + 1,
        e.name,
        `Rs. ${fmt(e.amount)}`,
        new Date(e.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      ]),

    tableWidth: CONTENT_W,

    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 44, halign: "left" },
      3: { cellWidth: 30, halign: "center" },
    },

    styles: {
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      valign: "middle",
      overflow: "linebreak",
      font: "helvetica",
      textColor: SL800,
      lineColor: SL200,
      lineWidth: 0.2,
    },

    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      halign: "center",
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
    },

    alternateRowStyles: { fillColor: [248, 250, 252] },

    margin: { left: MARGIN, right: MARGIN },

    didParseCell(data) {
      if (data.section === "body" && data.column.index === 2) {
        data.cell.styles.textColor = ACCENT_D;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // 4. SUMMARY STRIP
  const pageHeight = doc.internal.pageSize.getHeight();

  let SUM_Y = doc.lastAutoTable.finalY + 6;

  if (SUM_Y + 18 > pageHeight - 20) {
    doc.addPage();
    SUM_Y = 20;
  }

  const SUM_H = 18;

  rrect(doc, MARGIN, SUM_Y, CONTENT_W, SUM_H, 3, NAVY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(
    `${expenses.length} Transaction${expenses.length !== 1 ? "s" : ""}`,
    PAGE_W / 2,
    SUM_Y + 6.5,
    { align: "center" },
  );

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SL400);
  doc.text(`Total: Rs. ${fmt(total)}`, PAGE_W / 2, SUM_Y + 13, {
    align: "center",
  });

  // 5. FOOTER
const FOOT_Y = 285;

const pageCount = doc.getNumberOfPages();

for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);

  doc.setDrawColor(...SL200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, FOOT_Y, PAGE_W - MARGIN, FOOT_Y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ACCENT);
  doc.text("Expense Manager", MARGIN, FOOT_Y + 5);

  const brandW = doc.getTextWidth("Expense Manager");

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SL500);
  doc.text(" · Personal Finance Report", MARGIN + brandW, FOOT_Y + 5);

  doc.text(currentDate, PAGE_W - MARGIN, FOOT_Y + 5, {
    align: "right",
  });
}

  // save
  doc.save(`expense-report-${Date.now()}.pdf`);
};

export default exportPDF;
