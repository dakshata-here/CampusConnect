import React, { useRef, useState } from 'react';
import { Certificate } from '../../types';
import {
  X,
  Award,
  Download,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Check
} from 'lucide-react';
import { formatFullDate } from '../../utils/calendarUtils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface CertificateModalProps {
  certificate: Certificate;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generate & Save High-Quality PDF using jsPDF + html2canvas
  const handleDownloadPdf = async () => {
    if (!certificateRef.current || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);
      setDownloadSuccess(false);

      // Render certificate element into a high-DPI canvas
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#fffdfa',
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions for A4 landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const printWidth = imgWidth * ratio;
      const printHeight = imgHeight * ratio;

      const marginX = (pdfWidth - printWidth) / 2;
      const marginY = (pdfHeight - printHeight) / 2;

      pdf.addImage(imgData, 'PNG', marginX, marginY, printWidth, printHeight);

      // Clean file naming
      const safeStudent = certificate.studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `PICT_Certificate_${safeStudent}_${certificate.certificateNumber}.pdf`;

      pdf.save(fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to generate PDF certificate:', error);
      // Fallback to standard window print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct Print handler
  const handlePrint = () => {
    if (!certificateRef.current) {
      window.print();
      return;
    }

    // Create an isolated printable iframe for reliable printing inside iframe environments
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    const certHtml = certificateRef.current.outerHTML;

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PICT Certificate - ${certificate.studentName}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body onload="setTimeout(() => { window.focus(); window.print(); }, 400)">
          <div style="width: 100%; max-width: 960px; margin: auto;">
            ${certHtml}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Controls Bar (hidden during print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Verified Student Certificate • {certificate.certificateNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Save as PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </>
              )}
            </button>

            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              title="Print directly"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-res Printable Certificate Canvas */}
        <div
          ref={certificateRef}
          className="p-6 sm:p-12 bg-[#fffdfa] text-slate-900 relative overflow-hidden flex flex-col items-center text-center justify-between min-h-[500px] border-8 border-double border-amber-800/30 m-3 sm:m-6 rounded-2xl shadow-inner"
        >
          {/* Watermark Crest */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Award className="w-96 h-96 text-amber-900" />
          </div>

          {/* Certificate Header */}
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-extrabold text-xs tracking-widest uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Pune Institute of Computer Technology</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Certificate of Participation
            </h1>
            <p className="text-xs text-slate-500 italic">
              This is officially awarded to
            </p>
          </div>

          {/* Student Name */}
          <div className="my-6 space-y-1 relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-blue-900 border-b-2 border-amber-600/40 pb-2 px-6">
              {certificate.studentName}
            </div>
            <div className="text-xs text-slate-600 font-mono pt-1">
              Roll No / Enrollment: {certificate.studentEnrollment}
            </div>
          </div>

          {/* Event description */}
          <div className="max-w-xl text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 relative z-10">
            <p>
              for active participation in the technical event / workshop titled
            </p>
            <div className="font-extrabold text-base text-slate-900 bg-amber-100/70 py-1.5 px-4 rounded-xl border border-amber-300/80 inline-block">
              "{certificate.eventTitle}"
            </div>
            <p className="text-xs text-slate-600">
              organized by <span className="font-semibold text-slate-900">{certificate.clubName}</span> on{' '}
              <span className="font-semibold text-slate-900">{formatFullDate(certificate.issueDate)}</span>.
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="w-full grid grid-cols-3 gap-4 pt-10 mt-8 border-t border-slate-300/80 text-xs relative z-10">
            <div className="text-center space-y-1">
              <div className="font-serif italic text-sm text-slate-900 font-bold">
                Prof. S. R. Joshi
              </div>
              <div className="text-[11px] text-slate-500">Faculty Coordinator</div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-amber-600 p-1 flex flex-col items-center justify-center text-amber-700 bg-amber-50">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-[8px] font-bold uppercase tracking-tight">VERIFIED</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="font-serif italic text-sm text-slate-900 font-bold">
                Dr. S. K. Kulkarni
              </div>
              <div className="text-[11px] text-slate-500">Dean of Student Affairs</div>
            </div>
          </div>

          {/* Verification serial bottom footer */}
          <div className="w-full pt-4 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Certificate ID: {certificate.certificateNumber}</span>
            <span>Verify at: campusconnect.pict.edu/verify/{certificate.certificateNumber}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
