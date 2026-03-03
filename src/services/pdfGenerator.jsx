// src/services/pdfGenerator.js
import { pdf } from '@react-pdf/renderer';
import { QuotationPDF } from './QuotationPDF';
import { saveAs } from 'file-saver';

export const generateQuotationPDF = async (quot, company, totals, productNames, customerFull) => {
  try {
    console.log("เริ่มสร้างใบเสนอราคา PDF...");
    
    const blob = await pdf(
      <QuotationPDF 
        quot={quot} 
        company={company} 
        totals={totals} 
        productNames={productNames} 
        customerFull={customerFull} 
      />
    ).toBlob();
    
    saveAs(blob, `Quotation_${quot.quotationNo || 'Draft'}.pdf`);
    
    console.log("✅ สร้าง PDF สำเร็จ!");
  } catch (error) {
    console.error("PDF Error:", error);
    alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);
  }
};