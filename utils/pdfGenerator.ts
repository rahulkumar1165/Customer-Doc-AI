import { jsPDF } from 'jspdf';
import { Shipment, UserProfile } from '../types';

export const generateDocs = (shipment: Shipment, user: UserProfile): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // -- STYLES --
  const colors = {
    primary: [37, 99, 235], // Blue
    dark: [20, 20, 20],
    gray: [100, 100, 100],
    lightGray: [240, 240, 240]
  };

  // -- HEADER --
  doc.setFontSize(24);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('COMMERCIAL INVOICE', pageWidth - 20, 25, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text(`Invoice No: ${shipment.id.slice(-8).toUpperCase()}`, pageWidth - 20, 35, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 40, { align: 'right' });
  doc.text(`Page 1 of 1`, pageWidth - 20, 45, { align: 'right' });

  // -- EXPORTER & CONSIGNEE BOXES --
  let y = 60;
  
  // Left Box: Exporter (Seller)
  doc.setFont('helvetica', 'bold');
  doc.text('EXPORTER (SELLER)', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 5;
  doc.text(user.companyName, 20, y);
  
  // Split address lines roughly
  const sellerAddress = doc.splitTextToSize(user.address || 'Address not provided', 80);
  y += 5;
  doc.text(sellerAddress, 20, y);
  
  const sellerYEnd = y + (sellerAddress.length * 4);
  y = sellerYEnd + 5;
  
  if (user.taxId) {
     doc.text(`Tax ID / EORI: ${user.taxId}`, 20, y);
     y += 5;
  }
  doc.text(`Email: ${user.email}`, 20, y);
  doc.text(`Country: ${user.defaultOrigin}`, 20, y + 5);


  // Right Box: Consignee (Buyer)
  y = 60; // Reset Y
  const rightX = 110;
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIGNEE (SHIP TO)', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 5;
  doc.text(shipment.consigneeName, rightX, y);
  
  const buyerAddress = doc.splitTextToSize(shipment.consigneeAddress, 80);
  y += 5;
  doc.text(buyerAddress, rightX, y);
  
  const buyerYEnd = y + (buyerAddress.length * 4);
  y = buyerYEnd + 5;
  
  if (shipment.consigneeTaxId) {
    doc.text(`Tax ID: ${shipment.consigneeTaxId}`, rightX, y);
    y += 5;
  }
  doc.text(`Country: ${shipment.destinationCountry}`, rightX, y);

  // -- TRANSPORT INFO --
  y = Math.max(y, sellerYEnd) + 20;
  
  // Draw Box
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y); // Top line
  y += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Incoterms', 20, y);
  doc.text('Reason for Export', 60, y);
  doc.text('Total Packages', 110, y);
  doc.text('Gross Weight', 150, y);
  doc.text('Currency', 180, y);
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(shipment.incoterms, 20, y);
  doc.text(shipment.reasonForExport, 60, y);
  doc.text(shipment.packageCount.toString(), 110, y);
  doc.text(`${shipment.grossWeight} kg`, 150, y);
  doc.text(shipment.currency, 180, y);
  
  y += 5;
  doc.line(20, y, pageWidth - 20, y); // Bottom line
  
  // -- LINE ITEMS TABLE --
  y += 15;
  
  // Table Header
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.rect(20, y - 6, pageWidth - 40, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Description of Goods', 25, y);
  doc.text('HS Code', 95, y);
  doc.text('Origin', 120, y);
  doc.text('Qty', 140, y);
  doc.text('Unit', 155, y);
  doc.text('Total', 175, y);
  
  y += 12;
  
  // Item 1
  const totalVal = shipment.unitPrice * shipment.quantity;
  
  doc.setFont('helvetica', 'bold');
  doc.text(shipment.productDescription, 25, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Material: ${shipment.material || 'N/A'}`, 25, y);
  y += 4;
  doc.text(`Use: ${shipment.intendedUse || 'N/A'}`, 25, y);
  
  // Columns for the item
  doc.setFontSize(9);
  const rowY = y - 4; 
  doc.text(shipment.hsCode || '---', 95, rowY);
  doc.text(shipment.originCountry.substring(0, 3).toUpperCase(), 120, rowY);
  doc.text(shipment.quantity.toString(), 140, rowY);
  doc.text(shipment.unitPrice.toFixed(2), 155, rowY);
  doc.text(totalVal.toFixed(2), 175, rowY);

  // -- TOTALS --
  y += 20;
  doc.line(140, y, pageWidth - 20, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL INVOICE VALUE:', 140, y);
  doc.text(`${totalVal.toFixed(2)} ${shipment.currency}`, 190, y, { align: 'right' });
  
  // -- DECLARATION --
  y = 240; 
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const declaration = "I declare that the information contained in this invoice is true and correct. The contents of this shipment are as stated above.";
  doc.text(declaration, 20, y);
  
  y += 20;
  doc.text("__________________________", 20, y);
  doc.text("Authorized Signature", 20, y + 5);
  doc.text(`${user.companyName}`, 20, y + 10);
  
  // Return the URL as a string
  return doc.output('bloburl').toString();
};