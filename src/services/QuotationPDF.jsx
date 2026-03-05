// src/services/QuotationPDF.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'THSarabunNew',
  fonts: [
    { src: '/fonts/THSarabunNew.ttf' },
    { src: '/fonts/THSarabunNew-Bold.ttf', fontWeight: 'bold' }
  ]
});

const formatThaiDate = (dateStr, addDays = 0) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d)) return dateStr;
  d.setDate(d.getDate() + addDays);
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const PRIMARY_COLOR = '#be123c'; 
const BORDER_COLOR = '#e5e7eb';

const styles = StyleSheet.create({
  page: { paddingTop: 130, paddingBottom: 80, paddingHorizontal: 40, fontFamily: 'THSarabunNew', fontSize: 14, color: '#374151', lineHeight: 1.2 },
  
  headerFixed: { position: 'absolute', top: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: PRIMARY_COLOR, paddingBottom: 10 },
  logoImg: { width: 140, height: 70, objectFit: 'contain' },
  companyInfo: { width: '65%', alignItems: 'flex-end' },
  companyTextWrapper: { alignItems: 'center' },
  companyName: { fontSize: 24, fontWeight: 'bold', color: PRIMARY_COLOR, marginBottom: 4 },
  companyText: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  
  docTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, marginTop: 10 },
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
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '45%', backgroundColor: '#f3f4f6', padding: 8, fontWeight: 'bold', marginTop: 4 },
  grandTotalText: { color: '#000000', textDecoration: 'underline', textDecorationColor: '#000000' },

  signatureSection: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  signBox: { width: '40%', alignItems: 'center' },
  signImageContainer: { height: 60, width: '100%', position: 'relative', alignItems: 'center', justifyContent: 'flex-end' },
  signImg: { width: 120, height: 50, objectFit: 'contain', position: 'absolute', bottom: 5 },
  signLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#374151', borderStyle: 'solid' },
  signName: { fontWeight: 'bold', marginTop: 8, fontSize: 14 },
  signRole: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  pageNumber: { position: 'absolute', bottom: 30, right: 40, fontSize: 12, color: '#6b7280', fontFamily: 'THSarabunNew' }
});

export const QuotationPDF = ({ quot, company, totals, customerFull }) => {
  const factor = totals?.factor || 1;
  const shippingAddress = quot.shippingType === 'pickup' ? 'ลูกค้ามารับเอง (Pick up at Factory)' : (customerFull?.addressShip || '-');

  const renderTableRows = () => {
    const items = totals?.itemsCalc || [];
    
    // 🌟 หั่นข้อมูลเป็นแพ็ค แพ็คละ 2 รายการ 🌟
    const chunkedItems = [];
    for (let i = 0; i < items.length; i += 2) {
      chunkedItems.push(items.slice(i, i + 2));
    }

    let rowNum = 1;
    const allPages = [];

    // วนลูปตามจำนวนแพ็ค
    chunkedItems.forEach((chunk, chunkIndex) => {
        const currentChunkRows = [];

        // วนลูปกล่องภายในแพ็ค (ไม่เกิน 2 กล่อง)
        chunk.forEach((iCalc) => {
            const sellingBoxTotal = (iCalc.rawBoxCost * iCalc.qty) * factor;
            const sellingBoxUnit = iCalc.qty > 0 ? sellingBoxTotal / iCalc.qty : 0;
            
            const itemGroupRows = [];

            // 1. แถวกล่อง
            itemGroupRows.push(
              <View style={styles.tableRow} key={`box-${rowNum}`}>
                <Text style={styles.colNo}>{rowNum}</Text>
                <View style={styles.colDesc}>
                  <Text style={{ fontWeight: 'bold', color: PRIMARY_COLOR }}>รายการที่ {rowNum}: {iCalc.boxName}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>เกรด: {iCalc.paperName} | ขนาด: {iCalc.dim} cm</Text>
                </View>
                <Text style={styles.colQty}>{iCalc.qty.toLocaleString()}</Text>
                <Text style={styles.colUnit}>{sellingBoxUnit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                <Text style={styles.colTotal}>{sellingBoxTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
              </View>
            );

            // 2. แถวบล็อคพิมพ์
            (iCalc.blocks || []).forEach((block, bIdx) => {
              const rawPrice = parseFloat(block.price) || 0;
              if (rawPrice > 0) {
                const sellPrice = rawPrice * factor;
                itemGroupRows.push(
                  <View style={styles.tableRow} key={`block-${rowNum}-${bIdx}`}>
                    <Text style={styles.colNo}></Text>
                    <View style={styles.colDesc}>
                      <Text style={{ color: '#4b5563' }}>- ค่าบล็อคแม่พิมพ์ (ขนาด {block.w}x{block.l} นิ้ว)</Text>
                    </View>
                    <Text style={styles.colQty}>1</Text>
                    <Text style={styles.colUnit}>{sellPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                    <Text style={styles.colTotal}>{sellPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                  </View>
                );
              }
            });

            // 3. แถวใบมีด
            if (iCalc.dieCutCost > 0) {
              const sellingDieCut = iCalc.dieCutCost * factor;
              itemGroupRows.push(
                <View style={styles.tableRow} key={`diecut-${rowNum}`}>
                  <Text style={styles.colNo}></Text>
                  <View style={styles.colDesc}>
                    <Text style={{ color: '#4b5563' }}>- ค่าแบบใบมีดปั๊มตัด</Text>
                    {iCalc.dieCutW && <Text style={{ fontSize: 12, color: '#9ca3af' }}>ขนาด: {iCalc.dieCutW} x {iCalc.dieCutL} นิ้ว</Text>}
                  </View>
                  <Text style={styles.colQty}>1</Text>
                  <Text style={styles.colUnit}>{sellingDieCut.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                  <Text style={styles.colTotal}>{sellingDieCut.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                </View>
              );
            }

            // ยัดก้อนของสินค้านี้ลงไปใน Chunk ปัจจุบัน (ใช้ wrap=false ป้องกันฉีกขาดภายในไอเทมเดียวกัน)
            currentChunkRows.push(
                <View wrap={false} style={{ flexDirection: 'column' }} key={`group-${rowNum}`}>
                    {itemGroupRows}
                </View>
            );
            
            rowNum++;
        });

        // 4. ถ้าเป็น "แพ็คสุดท้าย" ให้บวกค่าจัดส่งและค่า Setup เข้าไป
        if (chunkIndex === chunkedItems.length - 1) {
            const globalRows = [];
            const sellingSetup = (totals?.setupCost || 0) * factor;
            if (sellingSetup > 0) {
              globalRows.push(
                <View style={styles.tableRow} key="setup">
                  <Text style={styles.colNo}>{rowNum++}</Text>
                  <View style={styles.colDesc}><Text>ค่าบริการเตรียมเครื่อง (Setup Cost)</Text></View>
                  <Text style={styles.colQty}>1</Text>
                  <Text style={styles.colUnit}>{sellingSetup.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                  <Text style={styles.colTotal}>{sellingSetup.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                </View>
              );
            }

            const sellingShip = (totals?.shipCost || 0) * factor;
            if (sellingShip > 0) {
              globalRows.push(
                <View style={styles.tableRow} key="ship">
                  <Text style={styles.colNo}>{rowNum++}</Text>
                  <View style={styles.colDesc}><Text>ค่าบริการจัดส่ง (Shipping Cost)</Text></View>
                  <Text style={styles.colQty}>1</Text>
                  <Text style={styles.colUnit}>{sellingShip.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                  <Text style={styles.colTotal}>{sellingShip.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                </View>
              );
            }

            if (globalRows.length > 0) {
                currentChunkRows.push(
                    <View wrap={false} style={{ flexDirection: 'column' }} key="global-costs">
                        {globalRows}
                    </View>
                );
            }
        }

        // 🌟 แทรกคำสั่ง Break หากไม่ใช่แพ็คแรกสุด 🌟
        allPages.push(
            <View key={`chunk-${chunkIndex}`} break={chunkIndex > 0}>
                {currentChunkRows}
            </View>
        );
    });

    return allPages;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.headerFixed} fixed>
          <View style={{ width: '35%' }}>
            {company?.logoUrl ? <Image style={styles.logoImg} src={company.logoUrl} /> : <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>[ ไม่มีโลโก้ ]</Text>}
          </View>
          <View style={styles.companyInfo}>
            <View style={styles.companyTextWrapper}>
              <Text style={styles.companyName}>{company?.nameTH || 'บริษัท สมาร์ทบ็อกซ์ จำกัด'}</Text>
              <Text style={styles.companyText}>ที่อยู่: {company?.addressTH || '-'}</Text>
              <Text style={styles.companyText}>เลขประจำตัวผู้เสียภาษี: {company?.taxId || '-'} | โทร: {company?.phone || '-'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.docTitle}>ใบเสนอราคา (QUOTATION)</Text>

        <Text style={styles.appreciationText}>
          {company?.nameTH || 'ทางบริษัทฯ'} ขอขอบพระคุณเป็นอย่างยิ่งที่ท่านได้ให้ความไว้วางใจและพิจารณาเลือกใช้บริการของเรา 
          ทางเรามีความยินดีขอเสนอราคาผลิตภัณฑ์และเงื่อนไขการให้บริการตามรายละเอียดดังต่อไปนี้
        </Text>

        <View style={styles.infoBox}>
          <View style={{ width: '55%' }}>
            <Text><Text style={styles.infoLabel}>เรียนลูกค้า: </Text>{customerFull?.company || customerFull?.name || quot.customerName || '-'}</Text>
            <Text><Text style={styles.infoLabel}>ที่อยู่จัดส่ง: </Text>{shippingAddress}</Text>
            <Text><Text style={styles.infoLabel}>โทรศัพท์: </Text>{customerFull?.mobile1 || '-'}</Text>
            <Text><Text style={styles.infoLabel}>เลขผู้เสียภาษี: </Text>{customerFull?.taxId || '-'}</Text>
          </View>
          <View style={{ width: '40%', textAlign: 'right' }}>
            <Text><Text style={styles.infoLabel}>เลขที่เอกสาร : </Text>{quot.quotationNo || '-'}</Text>
            <Text><Text style={styles.infoLabel}>วันที่ออกใบเสนอราคา : </Text>{formatThaiDate(quot.createdDate)}</Text>
            <Text><Text style={styles.infoLabel}>ราคานี้มีผลถึงวันที่ : </Text>{formatThaiDate(quot.createdDate, 10)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} fixed>
            <Text style={styles.colNo}>ลำดับ</Text>
            <Text style={styles.colDesc}>รายการ (Description)</Text>
            <Text style={styles.colQty}>จำนวน</Text>
            <Text style={styles.colUnit}>ราคา/หน่วย</Text>
            <Text style={styles.colTotal}>ราคารวม (฿)</Text>
          </View>
          {renderTableRows()}
        </View>

        {/* ยอดเงินและลายเซ็น จะถูกผลักลงไปล่างสุดเสมอ */}
        <View wrap={false} style={{ marginTop: 20 }}>
            <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                    <Text>รวมเป็นเงิน (ราคาก่อน VAT):</Text>
                    <Text>{(totals?.totalAfterDiscount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text>ภาษีมูลค่าเพิ่ม (VAT 7%):</Text>
                    <Text>{(totals?.netTotal - totals?.totalAfterDiscount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                </View>
                <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalText}>ยอดรวมทั้งสิ้น (Grand Total):</Text>
                    <Text style={styles.grandTotalText}>{(totals?.netTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ฿</Text>
                </View>
            </View>

            <View style={styles.signatureSection}>
                <View style={styles.signBox}>
                    <View style={styles.signImageContainer}></View>
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
        </View>

        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => (`หน้าที่ ${pageNumber} / ${totalPages}`)} 
          fixed 
        />

      </Page>
    </Document>
  );
};