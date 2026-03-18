import { jsPDF } from "jspdf";
import pptxgen from "pptxgenjs";
import { Flashcard, Slide } from "../types";

export const exportToPDF = (title: string, content: string) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(content, 170);
  doc.text(splitText, 20, 30);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

export const exportToPPT = (title: string, slides: Slide[]) => {
  const pres = new pptxgen();
  slides.forEach((slide) => {
    const s = pres.addSlide();
    s.addText(slide.title, { x: 0.5, y: 0.5, w: "90%", h: 1, fontSize: 24, bold: true, color: "363636" });
    s.addText(slide.content.join("\n"), { x: 0.5, y: 1.5, w: "90%", h: 4, fontSize: 18, color: "666666" });
  });
  pres.writeFile({ fileName: `${title.replace(/\s+/g, '_')}.pptx` });
};
