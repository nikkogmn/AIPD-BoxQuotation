// src/services/QuotationPDF.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// ลงทะเบียนฟอนต์ไทย
Font.register({
  family: 'THSarabunNew',
  fonts: [
    { src: '/fonts/THSarabunNew.ttf' },
    { src: '/fonts/THSarabunNew-Bold.ttf', fontWeight: 'bold' }
  ]
});

// ฟังก์ชันแปลงวันที่ (วัน เดือนเต็ม ปีค.ศ.)
const formatThaiDate = (dateStr, addDays = 0) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d)) return dateStr;
  d.setDate(d.getDate() + addDays);
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// 🎨 Theme: สีแดง
const PRIMARY_COLOR = '#be123c'; 
const BORDER_COLOR = '#e5e7eb';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'THSarabunNew', fontSize: 14, color: '#374151', lineHeight: 1.2 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: PRIMARY_COLOR, paddingBottom: 10, marginBottom: 15 },
  logoImg: { width: 120, height: 60, objectFit: 'contain' },
  companyInfo: { alignItems: 'flex-end', width: '65%' },
  companyName: { fontSize: 22, fontWeight: 'bold', color: PRIMARY_COLOR },
  companyText: { fontSize: 12, marginTop: 2 },
  
  docTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  appreciationText: { fontSize: 14, textIndent: 20, marginBottom: 15, textAlign: 'justify' },

  infoBox: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#fff1f2', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ffe4e6' },
  infoLabel: { fontWeight: 'bold', color: PRIMARY_COLOR },

  table: { width: '100%', borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 15 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR, minHeight: 30, alignItems: 'center' },
  tableHeader: { backgroundColor: PRIMARY_COLOR, color: 'white', fontWeight: 'bold' },
  colNo: { width: '10%', textAlign: 'center' },
  colDesc: { width: '45%', paddingLeft: 10 },
  colQty: { width: '15%', textAlign: 'center' },
  colUnit: { width: '15%', textAlign: 'right', paddingRight: 5 },
  colTotal: { width: '15%', textAlign: 'right', paddingRight: 10 },

  summaryBox: { alignItems: 'flex-end', marginBottom: 30 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', width: '45%', marginBottom: 4 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '45%', backgroundColor: PRIMARY_COLOR, color: 'white', padding: 6, fontWeight: 'bold', borderRadius: 4, marginTop: 4 },

  // 🌟 ปรับปรุงกล่องลายเซ็นให้ตรงกันเป๊ะ
  signatureSection: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  signBox: { width: '40%', alignItems: 'center' },
  signImageContainer: { height: 60, width: '100%', position: 'relative', alignItems: 'center', justifyContent: 'flex-end' },
  signImg: { width: 120, height: 50, objectFit: 'contain', position: 'absolute', bottom: 5 },
  signLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#374151', borderStyle: 'solid' },
  signName: { fontWeight: 'bold', marginTop: 8, fontSize: 14 },
  signRole: { fontSize: 12, color: '#6b7280', marginTop: 2 }
});

export const QuotationPDF = ({ quot, company, totals, productNames, customerFull }) => {
  // 🧮 คำนวณสัดส่วนราคา (กระจายส่วนลด/กำไรลงแต่ละไอเทม)
  const factor = totals?.grandTotalCost > 0 ? (totals?.totalAfterDiscount / totals?.grandTotalCost) : 1;
  const sellingBoxTotal = (totals?.boxCostA * quot.quantity) * factor;
  const sellingBoxUnit = quot.quantity > 0 ? sellingBoxTotal / quot.quantity : 0;
  const shippingAddress = quot.shippingType === 'pickup' ? 'ลูกค้ามารับเอง (Pick up at Factory)' : (customerFull?.addressShip || '-');

  // --- สร้างรายการในตารางแบบ Dynamic ---
  const renderTableRows = () => {
    const rows = [];
    let rowNum = 1;

    // 1. รายการกล่อง
    rows.push(
      <View style={styles.tableRow} key="box">
        <Text style={styles.colNo}>{rowNum++}</Text>
        <View style={styles.colDesc}>
          <Text style={{ fontWeight: 'bold' }}>{productNames?.boxName || 'กล่องลูกฟูก'}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>เกรด: {productNames?.paperName || '-'}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>ขนาด: {quot.dimW} x {quot.dimD} x {quot.dimH} cm</Text>
        </View>
        <Text style={styles.colQty}>{(quot.quantity || 0).toLocaleString()}</Text>
        <Text style={styles.colUnit}>{sellingBoxUnit.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        <Text style={styles.colTotal}>{sellingBoxTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
      </View>
    );

    // 2. รายการบล็อคพิมพ์ (วนลูปแยกทีละรายการ)
    const allBlocks = [...(quot.printBlocks1 || []), ...(quot.printBlocks2 || [])];
    allBlocks.forEach((block, idx) => {
      const rawPrice = parseFloat(block.price) || 0;
      if (rawPrice > 0) {
        const sellPrice = rawPrice * factor;
        rows.push(
          <View style={styles.tableRow} key={`block-${idx}`}>
            <Text style={styles.colNo}>{rowNum++}</Text>
            <View style={styles.colDesc}>
              <Text>ค่าบล็อคแม่พิมพ์ (ขนาด {block.w}x{block.l} นิ้ว)</Text>
            </View>
            <Text style={styles.colQty}>1</Text>
            <Text style={styles.colUnit}>{sellPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
            <Text style={styles.colTotal}>{sellPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
        );
      }
    });

    // 3. รายการใบมีด
    const sellingDieCut = (totals?.dieCutC || 0) * factor;
    if (sellingDieCut > 0) {
      rows.push(
        <View style={styles.tableRow} key="diecut">
          <Text style={styles.colNo}>{rowNum++}</Text>
          <View style={styles.colDesc}>
            <Text>ค่าแบบใบมีดปั๊มตัด (Die Cut Mold)</Text>
            {quot.dieCutW && <Text style={{ fontSize: 12, color: '#6b7280' }}>ขนาด: {quot.dieCutW} x {quot.dieCutL} นิ้ว</Text>}
          </View>
          <Text style={styles.colQty}>1</Text>
          <Text style={styles.colUnit}>{sellingDieCut.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          <Text style={styles.colTotal}>{sellingDieCut.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </View>
      );
    }

    // 4. ค่า Setup / ค่าจัดส่ง (ถ้ามี)
    const sellingSetup = (totals?.setupCost || 0) * factor;
    if (sellingSetup > 0) {
      rows.push(
        <View style={styles.tableRow} key="setup">
          <Text style={styles.colNo}>{rowNum++}</Text>
          <View style={styles.colDesc}><Text>ค่าบริการเตรียมเครื่อง (Setup Cost)</Text></View>
          <Text style={styles.colQty}>1</Text>
          <Text style={styles.colUnit}>{sellingSetup.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          <Text style={styles.colTotal}>{sellingSetup.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </View>
      );
    }

    const sellingShip = (totals?.shipCost || 0) * factor;
    if (sellingShip > 0) {
      rows.push(
        <View style={styles.tableRow} key="ship">
          <Text style={styles.colNo}>{rowNum++}</Text>
          <View style={styles.colDesc}><Text>ค่าบริการจัดส่ง (Shipping Cost)</Text></View>
          <Text style={styles.colQty}>1</Text>
          <Text style={styles.colUnit}>{sellingShip.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          <Text style={styles.colTotal}>{sellingShip.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </View>
      );
    }

    return rows;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: '35%' }}>
            {company?.logoUrl ? <Image style={styles.logoImg} src={company.logoUrl} /> : <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>[ ไม่มีโลโก้ ]</Text>}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company?.nameTH || 'บริษัท สมาร์ทบ็อกซ์ จำกัด'}</Text>
            <Text style={styles.companyText}>{company?.addressTH || '-'}</Text>
            <Text style={styles.companyText}>เลขประจำตัวผู้เสียภาษี: {company?.taxId || '-'} | โทร: {company?.phone || '-'}</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>ใบเสนอราคา (QUOTATION)</Text>

        <Text style={styles.appreciationText}>
          บริษัทฯขอขอบพระคุณเป็นอย่างยิ่งที่ท่านได้ให้ความไว้วางใจและพิจารณาเลือกใช้บริการของเรา 
          ทางเรามีความยินดีขอเสนอราคาผลิตภัณฑ์และเงื่อนไขการให้บริการตามรายละเอียดดังต่อไปนี้
        </Text>

        {/* ข้อมูลลูกค้า */}
        <View style={styles.infoBox}>
          <View style={{ width: '55%' }}>
            <Text><Text style={styles.infoLabel}>เรียนลูกค้า: </Text>{customerFull?.company || customerFull?.name || quot.customerName || '-'}</Text>
            <Text><Text style={styles.infoLabel}>ที่อยู่จัดส่ง: </Text>{shippingAddress}</Text>
            <Text><Text style={styles.infoLabel}>โทรศัพท์: </Text>{customerFull?.mobile1 || '-'}</Text>
            <Text><Text style={styles.infoLabel}>เลขผู้เสียภาษี: </Text>{customerFull?.taxId || '-'}</Text>
          </View>
          <View style={{ width: '40%', textAlign: 'right' }}>
            <Text><Text style={styles.infoLabel}>เลขที่เอกสาร: </Text>{quot.quotationNo || '-'}</Text>
            <Text><Text style={styles.infoLabel}>วันที่: </Text>{formatThaiDate(quot.createdDate)}</Text>
            <Text><Text style={styles.infoLabel}>ยืนราคาถึงวันที่: </Text>{formatThaiDate(quot.createdDate, 10)}</Text>
          </View>
        </View>

        {/* ตารางสินค้า (ดึงแถวมาจากฟังก์ชันด้านบน) */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colNo}>ลำดับ</Text>
            <Text style={styles.colDesc}>รายการ (Description)</Text>
            <Text style={styles.colQty}>จำนวน</Text>
            <Text style={styles.colUnit}>ราคา/หน่วย</Text>
            <Text style={styles.colTotal}>ราคารวม (฿)</Text>
          </View>
          
          {renderTableRows()}
        </View>

        {/* สรุปยอดเงิน */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>รวมเป็นเงิน (ราคาก่อน VAT):</Text>
            <Text>{(totals?.totalAfterDiscount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>ภาษีมูลค่าเพิ่ม (VAT 7%):</Text>
            <Text>{(totals?.netTotal - totals?.totalAfterDiscount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text>ยอดรวมทั้งสิ้น (Grand Total):</Text>
            <Text>{(totals?.netTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</Text>
          </View>
        </View>

        {/* ลายเซ็น (จัดขนานกันเป๊ะ) */}
        <View style={styles.signatureSection}>
          <View style={styles.signBox}>
            <View style={styles.signImageContainer}>
              {/* ฝั่งลูกค้าเว้นว่างไว้สำหรับเซ็น */}
            </View>
            <View style={styles.signLine}></View>
            <Text style={styles.signName}>ผู้สั่งซื้อ (Customer)</Text>
            <Text style={styles.signRole}>วันที่: ....../....../......</Text>
          </View>

          <View style={styles.signBox}>
            <View style={styles.signImageContainer}>
              {company?.signatureUrl && <Image style={styles.signImg} src={company.signatureUrl} />}
            </View>
            <View style={styles.signLine}></View>
            <Text style={styles.signName}>({company?.approverTH || 'ผู้มีอำนาจลงนาม'})</Text>
            <Text style={styles.signRole}>ผู้อนุมัติ (Authorized Signature)</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};