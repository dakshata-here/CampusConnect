import PDFDocument from 'pdfkit';
import { IEvent } from '../models/Event.js';
import { IEventRegistration } from '../models/EventRegistration.js';

export interface EventRegistrationPdfData {
  event: IEvent;
  clubName?: string;
  venueName?: string;
  registrations: Array<IEventRegistration & { studentId?: any }>;
}

/**
 * Generates an official, publication-ready PDF document of students
 * registered for a particular campus event.
 * STRICTLY REGISTRATION ONLY - NO ATTENDANCE DATA.
 */
export function generateEventRegistrationsPdf(data: EventRegistrationPdfData): PDFKit.PDFDocument {
  const { event, clubName = 'College / Department', venueName = 'On Campus / TBD', registrations } = data;

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 36,
    bufferPages: true,
    info: {
      Title: `CampusConnect - Registered Students - ${event.title}`,
      Author: 'CampusConnect Platform',
      Subject: 'Event Registration Documentation'
    }
  });

  const pageWidth = doc.page.width; // 841.89 for A4 landscape
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // ~770 pt

  // Header Banner
  doc.rect(margin, margin, contentWidth, 40).fill('#1e3a8a');
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold');
  doc.text('CampusConnect - Registered Students Documentation', margin + 14, margin + 12);
  doc.fontSize(9).font('Helvetica');
  doc.text('Official Registered Attendee Record', pageWidth - margin - 200, margin + 16, {
    width: 186,
    align: 'right'
  });

  // Event Meta Card
  const eventDateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'N/A';
  const timeStr = event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime || 'TBD';

  let currentY = margin + 50;
  doc.rect(margin, currentY, contentWidth, 54).fill('#f1f5f9');
  doc.rect(margin, currentY, contentWidth, 54).strokeColor('#cbd5e1').stroke();

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
  doc.text(`Event: ${event.title}`, margin + 12, currentY + 10, { width: 400 });

  doc.font('Helvetica').fontSize(9).fillColor('#334155');
  doc.text(`Club / Organizer: ${clubName}`, margin + 12, currentY + 26);
  doc.text(`Venue: ${venueName}`, margin + 12, currentY + 38);

  doc.text(`Date: ${eventDateStr}`, margin + 420, currentY + 10);
  doc.text(`Time: ${timeStr}`, margin + 420, currentY + 26);
  doc.font('Helvetica-Bold').fillColor('#1e3a8a');
  doc.text(`Total Registered Students: ${registrations.length}`, margin + 420, currentY + 38);

  // Table Columns Setup
  currentY += 66;

  const columns = [
    { label: '#', width: 26, align: 'center' },
    { label: 'Student Name', width: 120, align: 'left' },
    { label: 'PRN / Enrollment', width: 95, align: 'left' },
    { label: 'Email', width: 145, align: 'left' },
    { label: 'Department', width: 115, align: 'left' },
    { label: 'Year', width: 55, align: 'left' },
    { label: 'Phone', width: 80, align: 'left' },
    { label: 'Team Name', width: 70, align: 'left' },
    { label: 'Reg Date', width: 64, align: 'left' }
  ];

  const rowHeight = 20;

  // Draw Table Header
  const drawTableHeader = (y: number) => {
    doc.rect(margin, y, contentWidth, 22).fill('#334155');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);

    let x = margin + 4;
    columns.forEach((col) => {
      doc.text(col.label, x, y + 6, {
        width: col.width - 6,
        align: col.align as any
      });
      x += col.width;
    });
  };

  drawTableHeader(currentY);
  currentY += 22;

  // Draw Rows
  if (registrations.length === 0) {
    doc.rect(margin, currentY, contentWidth, 28).fill('#ffffff');
    doc.rect(margin, currentY, contentWidth, 28).strokeColor('#e2e8f0').stroke();
    doc.fillColor('#64748b').font('Helvetica-Oblique').fontSize(9);
    doc.text('No student registrations found for this event.', margin, currentY + 9, {
      width: contentWidth,
      align: 'center'
    });
    currentY += 28;
  } else {
    registrations.forEach((reg, index) => {
      // Check page overflow
      if (currentY + rowHeight > doc.page.height - margin - 25) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
        currentY = margin;
        drawTableHeader(currentY);
        currentY += 22;
      }

      const isEven = index % 2 === 0;
      doc.rect(margin, currentY, contentWidth, rowHeight).fill(isEven ? '#ffffff' : '#f8fafc');
      doc.rect(margin, currentY, contentWidth, rowHeight).strokeColor('#e2e8f0').stroke();

      const studentUser = reg.studentId as any;
      const name = studentUser?.name || 'N/A';
      const enrollment = reg.studentEnrollment || studentUser?.enrollmentNumber || 'N/A';
      const email = studentUser?.email || 'N/A';
      const department = studentUser?.department || 'N/A';
      const year = studentUser?.year || 'N/A';
      const phone = studentUser?.phone || 'N/A';
      const teamName = reg.teamName || '-';
      const regDate = reg.registrationDate
        ? new Date(reg.registrationDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit'
          })
        : '-';

      const rowValues = [
        String(index + 1),
        name,
        enrollment,
        email,
        department,
        year,
        phone,
        teamName,
        regDate
      ];

      doc.fillColor('#1e293b').font('Helvetica').fontSize(8);
      let x = margin + 4;
      columns.forEach((col, cIdx) => {
        doc.text(rowValues[cIdx], x, currentY + 5.5, {
          width: col.width - 6,
          align: col.align as any,
          lineBreak: false,
          ellipsis: true
        });
        x += col.width;
      });

      currentY += rowHeight;
    });
  }

  // Footer on each page
  const pageRange = doc.bufferedPageRange();
  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(7.5).fillColor('#94a3b8').font('Helvetica');
    const footerText = `CampusConnect • Official Event Documentation • Generated on ${new Date().toLocaleString()}`;
    doc.text(footerText, margin, doc.page.height - 24, {
      width: contentWidth / 2,
      align: 'left'
    });
    doc.text(`Page ${i + 1} of ${pageRange.count}`, pageWidth - margin - 100, doc.page.height - 24, {
      width: 100,
      align: 'right'
    });
  }

  return doc;
}
