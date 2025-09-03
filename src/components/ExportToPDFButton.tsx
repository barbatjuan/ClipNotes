"use client";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function ExportToPDFButton({ htmlContentId }: { htmlContentId: string }) {
  const exportToPDF = async () => {
    const element = document.getElementById(htmlContentId);
    if (!element) return;

    // Asegura que los checkboxes reflejen su estado visual
    // (html2canvas captura el DOM tal como está)
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('resumen-clipnotes.pdf');
  };

  return (
    <button
      onClick={exportToPDF}
      className="mt-4 px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 transition"
    >
      Exportar a PDF
    </button>
  );
}
