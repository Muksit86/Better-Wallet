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

const fmt = (n) => Number(n).toLocaleString("en-US");

// main

const exportBudgetPDF = (budget, expenses) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2; // 182 mm

// palette
  const NAVY = [15, 23, 42];
  const ACCENT = [29, 177, 195];
  const ACCENT_D = [24, 160, 177];
  const GREEN = [22, 163, 74];
  const GREEN_BG = [220, 252, 231];
  const RED = [220, 38, 38];
  const RED_BG = [254, 226, 226];
  const AMBER = [217, 119, 6];
  const ORANGE = [234, 88, 12];
  const ORANGE_BG = [255, 237, 213];
  const SL100 = [241, 245, 249];
  const SL200 = [226, 232, 240];
  const SL400 = [148, 163, 184];
  const SL500 = [100, 116, 139];
  const SL800 = [30, 41, 59];
  const WHITE = [255, 255, 255];

  // calculations
  const totalBudget = Number(budget.amount);
  const totalSpent = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const remaining = totalBudget - totalSpent;

  const pctUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const fillPct = Math.min(pctUsed, 100);

  let budgetStatus;
  let statusColor;
  let statusBg;

  if (remaining < 0) {
    budgetStatus = "OVERSPENT";
    statusColor = RED;
    statusBg = RED_BG;
  } else if (remaining === 0) {
    budgetStatus = "FULLY USED";
    statusColor = ORANGE;
    statusBg = ORANGE_BG;
  } else if (remaining <= totalBudget * 0.5) {
    budgetStatus = "LOW";
    statusColor = AMBER;
    statusBg = [254, 243, 199];
  } else {
    budgetStatus = "ON TRACK";
    statusColor = GREEN;
    statusBg = GREEN_BG;
  }

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
  const nameLines = doc.splitTextToSize(budget.name, CONTENT_W - 2);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const subLines = doc.splitTextToSize("Budget Expense Report", CONTENT_W);

  const headerH =
    H_PAD_T + nameLines.length * NL_H + 3 + subLines.length * SL_H + H_PAD_B;

  // Background
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, headerH, "F");

  // Top accent bar
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, PAGE_W, 2.5, "F");

  // Budget name
  let ny = H_PAD_T + NL_H;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  nameLines.forEach((ln) => {
    doc.text(ln, MARGIN, ny);
    ny += NL_H;
  });

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

  // STATS CARDS
  const CARD_GAP = 4;
  const CARD_W = (CONTENT_W - CARD_GAP * 3) / 4; // ≈ 42.5 mm
  const CARD_H = 28;
  const CARDS_Y = headerH + 10;

  const cards = [
    { label: "TOTAL BUDGET", value: `Rs. ${fmt(totalBudget)}`, color: ACCENT },
    { label: "TOTAL SPENT", value: `Rs. ${fmt(totalSpent)}`, color: SL800 },
    {
      label: "REMAINING",
      value: `Rs. ${fmt(remaining)}`,
      color: statusColor,
    },
    { label: "TRANSACTIONS", value: String(expenses.length), color: SL800 },
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

    // Value — auto-shrink
    const maxW = CARD_W - 8;
    fitText(doc, card.value, maxW, 10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...card.color);
    doc.text(card.value, cx + 5.5, CARDS_Y + 21);
  });


  // PROGRESS BAR
  const PROG_Y = CARDS_Y + CARD_H + 11;
  const BAR_H = 5;

  // Row: label left, pct right
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SL500);
  doc.text("BUDGET UTILISATION", MARGIN, PROG_Y);
  doc.text(`${pctUsed.toFixed(1)}% used`, PAGE_W - MARGIN, PROG_Y, {
    align: "right",
  });

  // Track (grey background)
  const BAR_Y = PROG_Y + 3;
  doc.setFillColor(...SL200);
  doc.setDrawColor(...SL200);
  doc.roundedRect(MARGIN, BAR_Y, CONTENT_W, BAR_H, 2.5, 2.5, "F");

  // Fill
  const barColor = statusColor;
  const fillW = fillPct > 0 ? Math.max((fillPct / 100) * CONTENT_W, 4) : 0;
  if (fillW > 0) {
    doc.setFillColor(...barColor);
    doc.roundedRect(MARGIN, BAR_Y, fillW, BAR_H, 2.5, 2.5, "F");
  }

  // Health badge — right aligned, sitting below bar
  const BADGE2_Y = BAR_Y + BAR_H + 5;
  const BADGE2_H = 7;
  const hLabel = budgetStatus;
  const hBg = statusBg;
  const hFg = statusColor;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");

  // measure after setting font/size
  const hLabelW = doc.getTextWidth(hLabel);
  const dotW = doc.getTextWidth("  "); // small gap before text
  const badge2W = hLabelW + dotW + 10;

  rrect(doc, PAGE_W - MARGIN - badge2W, BADGE2_Y, badge2W, BADGE2_H, 2, hBg);

  // Coloured dot 
  doc.setTextColor(...hFg);
  doc.text(hLabel, PAGE_W - MARGIN - badge2W / 2, BADGE2_Y + BADGE2_H * 0.64, {
    align: "center",
  });

  // 4. TRANSACTIONS TABLE
  const TABLE_Y = BADGE2_Y + BADGE2_H + 8;

  // Heading
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
      fontSize: 8.5,
      halign: "center",
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

  // 5. SUMMARY STRIP — split into two lines if needed
  const pageHeight = doc.internal.pageSize.getHeight();

  let SUM_Y = doc.lastAutoTable.finalY + 6;

  if (SUM_Y + 18 > pageHeight - 20) {
    doc.addPage();
    SUM_Y = 20;
  }
  const SUM_H = 18;

  rrect(doc, MARGIN, SUM_Y, CONTENT_W, SUM_H, 3, NAVY);

  // Line 1: Spent · Transactions
  const line1 = `Spent: Rs. ${fmt(totalSpent)}   |   ${expenses.length} Transaction${expenses.length !== 1 ? "s" : ""}`;
  // Line 2: Remaining
  const line2 = `Remaining: Rs. ${fmt(remaining)}`;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(line1, PAGE_W / 2, SUM_Y + 6.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SL400);
  doc.text(line2, PAGE_W / 2, SUM_Y + 13, { align: "center" });

  // 6. FOOTER
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

    doc.text(currentDate, PAGE_W - MARGIN, FOOT_Y + 5, { align: "right" });
  }

  // save
  doc.save(`${budget.name}-report.pdf`);
};

export default exportBudgetPDF;
