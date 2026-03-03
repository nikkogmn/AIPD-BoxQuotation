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

// ฟังก์ชันแปลงวันที่ เป็น วันที่ เดือน(เต็ม) ปี ค.ศ.
const formatThaiDate = (dateStr, addDays = 0) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d)) return dateStr;
  d.setDate(d.getDate() + addDays);
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// 🎨 Theme: สีแดงทันสมัย (Modern Red)
const PRIMARY_COLOR = '#be123c'; // สีแดงโทนเข้มทันสมัย
const BORDER_COLOR = '#e5e7eb';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'THSarabunNew', fontSize: 14, color: '#374151', lineHeight: 1.2 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: PRIMARY_COLOR, paddingBottom: 10, marginBottom: 15 },
  logoImg: { width: 120, height: 60, objectFit: 'contain' },
  companyInfo: { alignItems: 'flex-end', width: '65%' },
  companyName: { fontSize: 22, fontWeight: 'bold', color: PRIMARY_COLOR },
  companyText: { fontSize: 12, marginTop: 2 },
  
  docTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  
  // ข้อความขอบคุณ
  appreciationText: { fontSize: 14, textIndent: 20, marginBottom: 15, textAlign: 'justify' },

  // Customer Info Box
  infoBox: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#fff1f2', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ffe4e6' },
  infoLabel: { fontWeight: 'bold', color: PRIMARY_COLOR },

  // Table
  table: { width: '100%', borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 15 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR, minHeight: 30, alignItems: 'center' },
  tableHeader: { backgroundColor: PRIMARY_COLOR, color: 'white', fontWeight: 'bold' },
  colNo: { width: '10%', textAlign: 'center' },
  colDesc: { width: '45%', paddingLeft: 10 },
  colQty: { width: '15%', textAlign: 'center' },
  colUnit: { width: '15%', textAlign: 'right', paddingRight: 5 },
  colTotal: { width: '15%', textAlign: 'right', paddingRight: 10 },

  // Summary
  summaryBox: { alignItems: 'flex-end', marginBottom: 30 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', width: '45%', marginBottom: 4 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '45%', backgroundColor: PRIMARY_COLOR, color: 'white', padding: 6, fontWeight: 'bold', borderRadius: 4, marginTop: 4 },

  // Signature
  signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 20 },
  signBox: { width: '40%', alignItems: 'center' },
  signImg: { width: 120, height: 60, objectFit: 'contain', marginBottom: 5 },
  signLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#9ca3af', borderStyle: 'solid', marginBottom: 5 },
});

export const QuotationPDF = ({ quot, company, totals, productNames, customerFull }) => {
  // 🧮 คำนวณสัดส่วนราคาเพื่อแสดงผล (กระจายกำไร/ส่วนลดเข้าไปในแต่ละรายการเพื่อให้ยอดรวมเป๊ะ)
  const factor = totals?.grandTotalCost > 0 ? (totals?.totalAfterDiscount / totals?.grandTotalCost) : 1;
  const sellingBoxTotal = (totals?.boxCostA * quot.quantity) * factor;
  const sellingBoxUnit = quot.quantity > 0 ? sellingBoxTotal / quot.quantity : 0;
  const sellingBlock = (totals?.blockCostB || 0) * factor;
  const sellingDieCut = (totals?.dieCutC || 0) * factor;
  
  // ที่อยู่จัดส่ง (เช็คว่ามารับเองหรือไม่)
  const shippingAddress = quot.shippingType === 'pickup' ? 'ลูกค้ามารับเอง (Pick up at Factory)' : (customerFull?.addressShip || '-');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* 1. โลโก้ และ ข้อมูลบริษัท */}
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

        {/* 2. ข้อความซาบซึ้งใจ (Appreciation Message) */}
        <Text style={styles.appreciationText}>
          บริษัทฯ ขอขอบพระคุณเป็นอย่างยิ่งที่ท่านได้ให้ความไว้วางใจและพิจารณาเลือกใช้บริการของเรา 
          ทางเรามีความยินดีขอเสนอราคาผลิตภัณฑ์และเงื่อนไขการให้บริการตามรายละเอียดดังต่อไปนี้
        </Text>

        {/* 3. ข้อมูลลูกค้าแบบเต็ม */}
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

        {/* 4. ตารางสินค้า */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colNo}>ลำดับ</Text>
            <Text style={styles.colDesc}>รายการ (Description)</Text>
            <Text style={styles.colQty}>จำนวน</Text>
            <Text style={styles.colUnit}>ราคา/หน่วย</Text>
            <Text style={styles.colTotal}>ราคารวม (฿)</Text>
          </View>

          {/* รายการที่ 1: กล่อง */}
          <View style={styles.tableRow}>
            <Text style={styles.colNo}>1</Text>
            <View style={styles.colDesc}>
              <Text style={{ fontWeight: 'bold' }}>{productNames?.boxName || 'กล่องลูกฟูก'}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>เกรด: {productNames?.paperName || '-'}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>ขนาด: {quot.dimW} x {quot.dimD} x {quot.dimH} cm</Text>
            </View>
            <Text style={styles.colQty}>{(quot.quantity || 0).toLocaleString()}</Text>
            <Text style={styles.colUnit}>{sellingBoxUnit.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
            <Text style={styles.colTotal}>{sellingBoxTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>

          {/* รายการที่ 2: บล็อคพิมพ์ (ถ้ามี) */}
          {sellingBlock > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.colNo}>2</Text>
              <View style={styles.colDesc}><Text>ค่าแม่พิมพ์ (Printing Block)</Text></View>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colUnit}>{sellingBlock.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
              <Text style={styles.colTotal}>{sellingBlock.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
            </View>
          )}

          {/* รายการที่ 3: ใบมีด (ถ้ามี) */}
          {sellingDieCut > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.colNo}>{sellingBlock > 0 ? '3' : '2'}</Text>
              <View style={styles.colDesc}><Text>ค่าใบมีดปั๊มตัด (Die Cut Mold)</Text></View>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colUnit}>{sellingDieCut.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
              <Text style={styles.colTotal}>{sellingDieCut.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
            </View>
          )}
        </View>

        {/* 5. สรุปยอดเงิน */}
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

        {/* 6. ลายเซ็น */}
        <View style={styles.signatureSection}>
          <View style={styles.signBox}>
            <View style={{ height: 60, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
              <View style={styles.signLine}></View>
            </View>
            <Text style={{ fontWeight: 'bold' }}>ผู้สั่งซื้อ (Customer)</Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>วันที่: ....../....../......</Text>
          </View>

          <View style={styles.signBox}>
            <View style={{ height: 60, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
              {company?.signatureUrl ? <Image style={styles.signImg} src={company.signatureUrl} /> : null}
              {!company?.signatureUrl && <View style={styles.signLine}></View>}
            </View>
            {company?.signatureUrl && <View style={styles.signLine}></View>}
            <Text style={{ fontWeight: 'bold' }}>({company?.approverTH || 'ผู้มีอำนาจลงนาม'})</Text>
            <Text>ผู้อนุมัติ (Authorized Signature)</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};