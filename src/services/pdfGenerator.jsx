import { pdf } from '@react-pdf/renderer';
import { QuotationPDF } from './QuotationPDF';
import { saveAs } from 'file-saver'; // ถ้าไม่มีให้รัน npm install file-saver

export const generateQuotationPDF = async (quot, company) => {
  try {
    console.log("กำลังสร้าง PDF ด้วยระบบ React-PDF...");
    
    // สร้าง Blob จาก Component ที่เราออกแบบไว้
    const blob = await pdf(<QuotationPDF quot={quot} company={company} />).toBlob();
    
    // สั่งดาวน์โหลด
    saveAs(blob, `Quotation_${quot.quotationNo || 'Draft'}.pdf`);
    
    console.log("✅ ดาวน์โหลดสำเร็จ!");
  } catch (error) {
    console.error("PDF Error:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
};