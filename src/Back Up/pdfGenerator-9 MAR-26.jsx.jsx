// src/services/pdfGenerator.js
import { pdf } from '@react-pdf/renderer';
import { QuotationPDF } from './QuotationPDF';
import { saveAs } from 'file-saver';

// 🌟 1. เพิ่ม exportFileName เข้ามาเป็น Parameter ตัวสุดท้าย
export const generateQuotationPDF = async (quot, company, totals, productNames, customerFull, exportFileName) => {
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
    
    // 🌟 2. ใช้ชื่อไฟล์ใหม่ที่ส่งมา (เผื่อกรณีไม่มีชื่อส่งมา ก็ใช้ชื่อ Default สำรองไว้)
    const finalFileName = exportFileName || `Quotation_${quot.quotationNo || 'Draft'}.pdf`;
    
    saveAs(blob, finalFileName);
    
    console.log("✅ สร้าง PDF สำเร็จ!");
  } catch (error) {
    console.error("PDF Error:", error);
    alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);
  }
};