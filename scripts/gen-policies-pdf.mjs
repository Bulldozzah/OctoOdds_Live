/**
 * Builds public/octoodds-policies.pdf from the text in ./legal-print.mjs.
 * Regenerate after editing any policy:  npm run gen:policies-pdf
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { DOC } from "./legal-print.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "public", "octoodds-policies.pdf");

const doc = new PDFDocument({
  bufferPages: true,
  size: "A4",
  margins: { top: 64, bottom: 64, left: 64, right: 64 },
  info: { Title: DOC.title, Author: "OctoOdds" },
});
doc.pipe(fs.createWriteStream(out));

// Page numbers are added once every page exists, so collect them after write.
const addPageNumbers = () => {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor("#888888")
      .text(`${DOC.title} — page ${i + 1} of ${pages.count}`, 64, doc.page.height - 42, {
        align: "center",
        lineBreak: false,
      });
  }
};

doc.fontSize(22).fillColor("#111111").text(DOC.title, { align: "center" }).moveDown(0.4);
doc.fontSize(10).fillColor("#666666").text(DOC.updated, { align: "center" });
doc.text(DOC.contact, { align: "center" }).moveDown(1.2);
doc
  .fontSize(10)
  .fillColor("#444444")
  .text(
    "This document contains the same policies published at https://www.octoodds.com. The website versions are the current authoritative copies.",
    { align: "center" },
  )
  .moveDown(1.5);

for (const [pi, policy] of DOC.policies.entries()) {
  if (pi > 0) doc.addPage();
  doc.fontSize(15).fillColor("#0f3d6e").text(policy.title).moveDown(0.5);
  for (const section of policy.sections) {
    doc
      .fontSize(11)
      .fillColor("#222222")
      .text(section.title, { paragraphGap: 6 })
      .fontSize(9.5)
      .fillColor("#333333")
      .list(section.body, { bulletRadius: 1.5, paragraphGap: 4, indent: 12 });
    doc.moveDown(0.5);
  }
}

addPageNumbers();
doc.end();
console.log(`Wrote ${out}`);
