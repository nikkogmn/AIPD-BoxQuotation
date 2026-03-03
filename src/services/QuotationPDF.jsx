import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// 1. ลงทะเบียนฟอนต์ ชี้ไปที่ไฟล์ใน public/fonts ได้เลย!
Font.register({
  family: 'THSarabunNew',
  fonts: [
    { src: '/fonts/THSarabunNew.ttf' },
    { src: '/fonts/THSarabunNew-Bold.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'THSarabunNew', fontSize: 16 },
  header: { fontSize: 24, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
  section: { marginBottom: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 5 },
  label: { width: 100, fontWeight: 'bold' },
  tableHeader: { backgroundColor: '#F0F0F0', fontWeight: 'bold' }
});

export const QuotationPDF = ({ quot, company }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* ส่วนหัวบริษัท */}
      <View style={styles.section}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{company.nameTH || 'บริษัท สมาร์ทบ็อกซ์ จำกัด'}</Text>
        <Text>{company.addressTH || '-'}</Text>
      </View>

      <Text style={styles.header}>ใบเสนอราคา (Quotation)</Text>

      {/* ข้อมูลลูกค้า */}
      <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <View>
          <Text style={{ fontWeight: 'bold' }}>ลูกค้า:</Text>
          <Text>{quot.customerName || 'ไม่ระบุชื่อลูกค้า'}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text>เลขที่: {quot.quotationNo || '-'}</Text>
          <Text>วันที่: {quot.createdDate ? quot.createdDate.split(' ')[0] : '-'}</Text>
        </View>
      </View>

      {/* ตารางสินค้า (จัด Layout ได้อิสระ) */}
      <View style={[styles.row, styles.tableHeader]}>
        <Text style={{ flex: 1 }}>รายการ</Text>
        <Text style={{ width: 60, textAlign: 'center' }}>จำนวน</Text>
        <Text style={{ width: 80, textAlign: 'right' }}>ราคารวม</Text>
      </View>
      <View style={styles.row}>
        <Text style={{ flex: 1 }}>{quot.boxStyleId} (ขนาดสเปคตามระบุ)</Text>
        <Text style={{ width: 60, textAlign: 'center' }}>{quot.quantity}</Text>
        <Text style={{ width: 80, textAlign: 'right' }}>{quot.grandTotal || 0}</Text>
      </View>

      {/* ยอดรวมสุทธิ */}
      <View style={{ marginTop: 20, textAlign: 'right' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>ยอดรวมสุทธิ: {quot.grandTotal || 0} บาท</Text>
      </View>
    </Page>
  </Document>
);