// src/services/pdfGenerator.js
import { pdf } from '@react-pdf/renderer';
import { QuotationPDF } from './QuotationPDF';
import { saveAs } from 'file-saver';

// 1. ฟังก์ชันเดิม (เพิ่มส่งค่า isInvoice=false)
export const generateQuotationPDF = async (quot, company, totals, productNames, customerFull, exportFileName) => {
  try {
    console.log("เริ่มสร้างใบเสนอราคา PDF...");
    const blob = await pdf(
      <QuotationPDF quot={quot} company={company} totals={totals} productNames={productNames} customerFull={customerFull} isInvoice={false} />
    ).toBlob();
    const finalFileName = exportFileName || `Quotation_${quot.quotationNo || 'Draft'}.pdf`;
    saveAs(blob, finalFileName);
    console.log("✅ สร้าง PDF สำเร็จ!");
  } catch (error) {
    console.error("PDF Error:", error);
    alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);
  }
};

// 2. ฟังก์ชันใหม่ (ส่งค่า isInvoice=true)
export const generateInvoicePDF = async (quot, company, totals, productNames, customerFull, exportFileName) => {
  try {
    console.log("เริ่มสร้างใบแจ้งหนี้ PDF...");
    const blob = await pdf(
      <QuotationPDF quot={quot} company={company} totals={totals} productNames={productNames} customerFull={customerFull} isInvoice={true} />
    ).toBlob();
    const finalFileName = exportFileName || `Invoice_${quot.quotationNo || 'Draft'}.pdf`;
    saveAs(blob, finalFileName);
    console.log("✅ สร้าง PDF ใบแจ้งหนี้สำเร็จ!");
  } catch (error) {
    console.error("PDF Error:", error);
    alert("เกิดข้อผิดพลาดในการสร้าง PDF ใบแจ้งหนี้: " + error.message);
  }
};