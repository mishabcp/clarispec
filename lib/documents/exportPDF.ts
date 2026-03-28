export async function exportToPDF(title: string, markdownContent: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Theme Colors
  const silverAccent = [130, 130, 130] // Silver
  const darkGray = [40, 40, 40]
  const lightGray = [160, 160, 160]

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - margin * 2

  let y = margin

  const addHeaderAndFooter = (pageNum: number, total: number) => {
    // Header
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
    doc.text('CLARISPEC | DOCUMENT INTELLIGENCE SYSTEM', margin, 12)
    
    doc.setDrawColor(silverAccent[0], silverAccent[1], silverAccent[2])
    doc.setLineWidth(0.3)
    doc.line(margin, 15, pageWidth - margin, 15)

    // Footer
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `CONFIDENTIAL | Generated on ${new Date().toLocaleDateString()} | Page ${pageNum} of ${total}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // Cover / Title Section
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text(title.toUpperCase(), margin, y + 10)
  
  y += 24
  
  doc.setDrawColor(silverAccent[0], silverAccent[1], silverAccent[2])
  doc.setLineWidth(0.8)
  doc.line(margin, y, margin + 40, y)
  
  y += 12

  // Start Content
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)

  const lines = markdownContent.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Page overflow check
    if (y > pageHeight - 25) {
      doc.addPage()
      y = margin + 10
    }

    if (line.startsWith('# ')) {
      y += 6
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(silverAccent[0], silverAccent[1], silverAccent[2])
      doc.text(line.replace(/^#\s*/, '').toUpperCase(), margin, y)
      y += 12
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
    } else if (line.startsWith('## ')) {
      y += 6
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(90, 90, 90)
      doc.text(line.replace(/^##\s*/, '').toUpperCase(), margin, y)
      y += 9
      doc.setFontSize(11)
    } else if (line.startsWith('### ')) {
      y += 4
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(110, 110, 110)
      doc.text(line.replace(/^###\s*/, ''), margin, y)
      y += 7
      doc.setFontSize(11)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletContent = line.replace(/^[\-\*]\s*/, '')
      const splitLines = doc.splitTextToSize(`•  ${bulletContent}`, maxWidth)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(splitLines, margin, y)
      y += splitLines.length * 6
    } else if (line === '') {
      y += 4
    } else {
      // Better formatting for body text
      const cleaned = line
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')

      const splitLines = doc.splitTextToSize(cleaned, maxWidth)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(70, 70, 70)
      doc.text(splitLines, margin, y)
      y += splitLines.length * 6
    }
  }

  // Final Pass to Add Header/Footer to all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addHeaderAndFooter(i, totalPages)
  }

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
}
