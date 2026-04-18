'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { ScanResult } from '@/app/types/scan';
import { jsPDF } from 'jspdf';

interface PDFExportButtonProps {
  result: ScanResult;
}

export function PDFExportButton({ result }: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // Color palette - clean, professional
      const colors = {
        primary: [41, 98, 255],      // Blue
        dark: [30, 41, 59],         // Slate 900
        gray: [100, 116, 139],      // Slate 500
        lightGray: [241, 245, 249],  // Slate 100
        white: [255, 255, 255],
        success: [34, 197, 94],     // Green
        warning: [234, 179, 8],     // Yellow
        danger: [239, 68, 68],      // Red
        border: [226, 232, 240],    // Slate 200
      };

      // Helper to add text with automatic wrapping
      const addText = (text: string, x: number, y: number, options: {
        size?: number;
        color?: number[];
        bold?: boolean;
        maxWidth?: number;
        lineHeight?: number;
      } = {}) => {
        const { size = 10, color = colors.dark, bold = false, maxWidth = contentWidth, lineHeight = 1.4 } = options;
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(color[0], color[1], color[2]);
        
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return lines.length * size * 0.3528 * lineHeight; // Return height used
      };

      // Header - clean minimal style
      doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.rect(0, 0, pageWidth, 28, 'F');
      
      addText('Security Assessment Report', margin, 18, { size: 16, color: colors.white, bold: true });
      addText(`Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, 24, { size: 8, color: [148, 163, 184] });

      yPos = 40;

      // Main Info Card - clean border style
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPos, contentWidth, 35, 2, 2, 'S');
      
      // Domain
      addText(result.domain, margin + 8, yPos + 12, { size: 14, bold: true });
      
      // Meta info
      const metaText = `${result.mode.toUpperCase()} Scan  •  ${result.duration}ms  •  ${new Date(result.scanTime).toLocaleString()}`;
      addText(metaText, margin + 8, yPos + 20, { size: 8, color: colors.gray });

      // Grade - right aligned, circular badge style
      const gradeX = pageWidth - margin - 25;
      const gradeY = yPos + 8;
      const gradeColor = result.score >= 90 ? colors.success : 
                        result.score >= 70 ? colors.warning : colors.danger;
      
      doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
      doc.circle(gradeX + 12, gradeY + 10, 10, 'F');
      addText(result.grade, gradeX + 12, gradeY + 14, { size: 12, color: colors.white, bold: true, maxWidth: 20 });
      addText(`${result.score}/100`, gradeX + 12, gradeY + 24, { size: 8, color: colors.gray, maxWidth: 30 });

      yPos += 45;

      // Score Section with progress bar
      addText('Security Score', margin, yPos, { size: 11, bold: true });
      yPos += 8;

      // Progress bar background
      doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
      doc.roundedRect(margin, yPos, contentWidth, 6, 3, 3, 'F');
      
      // Progress bar fill
      const progressWidth = (contentWidth * result.score) / 100;
      doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
      doc.roundedRect(margin, yPos, progressWidth, 6, 3, 3, 'F');

      yPos += 12;

      // Stats Row - inline, minimal
      const goodCount = result.findings.filter(f => f.severity === 'good').length;
      const warnCount = result.findings.filter(f => f.severity === 'warning').length;
      const badCount = result.findings.filter(f => f.severity === 'bad' || f.severity === 'critical').length;

      const statY = yPos;
      const statSpacing = contentWidth / 3;
      
      // Good
      addText(goodCount.toString(), margin + statSpacing * 0, statY + 6, { size: 20, color: colors.success, bold: true, maxWidth: statSpacing - 10 });
      addText('Passed', margin + statSpacing * 0, statY + 14, { size: 9, color: colors.gray, maxWidth: statSpacing - 10 });
      
      // Warning
      addText(warnCount.toString(), margin + statSpacing * 1, statY + 6, { size: 20, color: colors.warning, bold: true, maxWidth: statSpacing - 10 });
      addText('Warnings', margin + statSpacing * 1, statY + 14, { size: 9, color: colors.gray, maxWidth: statSpacing - 10 });
      
      // Issues
      addText(badCount.toString(), margin + statSpacing * 2, statY + 6, { size: 20, color: colors.danger, bold: true, maxWidth: statSpacing - 10 });
      addText('Issues', margin + statSpacing * 2, statY + 14, { size: 9, color: colors.gray, maxWidth: statSpacing - 10 });

      yPos += 28;

      // Divider
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 12;

      // Findings Section
      if (result.findings.length > 0) {
        addText('Detailed Findings', margin, yPos, { size: 13, bold: true });
        yPos += 10;

        // Group by category
        const categories: Record<string, typeof result.findings> = {};
        result.findings.forEach(finding => {
          const cat = finding.category || 'general';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(finding);
        });

        Object.entries(categories).forEach(([category, findings]) => {
          if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
          }

          // Category label - pill style
          doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
          doc.roundedRect(margin, yPos - 4, 35, 8, 4, 4, 'F');
          addText(category.toUpperCase(), margin + 6, yPos + 1, { size: 7, color: colors.gray, bold: true, maxWidth: 30 });
          yPos += 12;

          findings.forEach((finding) => {
            if (yPos > pageHeight - 45) {
              doc.addPage();
              yPos = margin;
            }

            // Severity badge
            const severityColors = {
              good: colors.success,
              warning: colors.warning,
              bad: colors.danger,
              critical: colors.danger,
              info: colors.gray
            };
            const severityColor = severityColors[finding.severity as keyof typeof severityColors] || colors.gray;
            const severityLabel = finding.severity.toUpperCase();
            const badgeWidth = severityLabel.length * 2 + 4;
            
            doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
            doc.roundedRect(margin, yPos - 1, badgeWidth, 5, 2, 2, 'F');
            addText(severityLabel, margin + 2, yPos + 2.5, { size: 6, color: colors.white, bold: true, maxWidth: badgeWidth });

            // Finding title
            const titleHeight = addText(finding.title, margin + badgeWidth + 4, yPos + 2, { size: 10, bold: true, maxWidth: contentWidth - badgeWidth - 8 });
            
            // Description
            const descY = yPos + titleHeight + 2;
            const descHeight = addText(finding.description, margin + 4, descY, { size: 8, color: colors.dark, maxWidth: contentWidth - 8, lineHeight: 1.5 });
            
            // Details (if available)
            let detailsHeight = 0;
            if (finding.details) {
              detailsHeight = addText(`Details: ${finding.details}`, margin + 4, descY + descHeight + 1, { 
                size: 7, 
                color: colors.gray, 
                maxWidth: contentWidth - 8,
                lineHeight: 1.3 
              });
            }
            
            // Recommendation (if available)
            let recHeight = 0;
            if (finding.recommendation) {
              recHeight = addText(`Recommendation: ${finding.recommendation}`, margin + 4, descY + descHeight + detailsHeight + 1, { 
                size: 7, 
                color: colors.primary, 
                maxWidth: contentWidth - 8,
                lineHeight: 1.3 
              });
            }
            
            yPos += titleHeight + descHeight + detailsHeight + recHeight + 8;
          });

          yPos += 4;
        });
      }

      // AI Analysis Section
      if (result.aiAnalysis) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = margin;
        }

        yPos += 8;
        
        // Section header with accent
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.roundedRect(margin, yPos - 6, 3, 16, 1.5, 1.5, 'F');
        addText('AI-Powered Analysis', margin + 8, yPos, { size: 12, bold: true });
        yPos += 12;

        // Summary box
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, yPos - 2, contentWidth, 1, 1, 1, 'F');
        yPos += 6;

        const summaryHeight = addText(result.aiAnalysis.aiSummary, margin, yPos, { size: 9, color: colors.dark, maxWidth: contentWidth, lineHeight: 1.5 });
        yPos += summaryHeight + 10;

        // Recommendations
        if (result.aiAnalysis.recommendations && result.aiAnalysis.recommendations.length > 0) {
          addText('Key Recommendations', margin, yPos, { size: 10, bold: true, color: colors.primary });
          yPos += 10;

          result.aiAnalysis.recommendations.slice(0, 4).forEach((rec) => {
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = margin;
            }

            // Priority indicator
            const priorityColor = rec.priority === 'high' ? colors.danger :
                                 rec.priority === 'medium' ? colors.warning : colors.success;
            doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
            doc.roundedRect(margin, yPos, 2, 10, 1, 1, 'F');

            addText(rec.title, margin + 6, yPos + 3, { size: 9, bold: true, maxWidth: contentWidth - 10 });
            const descHeight = addText(rec.description, margin + 6, yPos + 10, { size: 8, color: colors.gray, maxWidth: contentWidth - 10 });
            
            yPos += descHeight + 12;
          });
        }
      }

      // Footer on all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        addText(`Security Posture Assessment  •  ${result.domain}  •  Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { 
          size: 8, 
          color: colors.gray,
          maxWidth: contentWidth 
        });
      }

      doc.save(`security-assessment-${result.domain}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.button
      onClick={generatePDF}
      disabled={isGenerating}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
      style={{
        backgroundColor: '#6366f1',
        color: 'white',
        border: '2px solid #6366f1',
        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
      }}
    >
      {isGenerating ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export PDF</span>
        </>
      )}
    </motion.button>
  );
}
