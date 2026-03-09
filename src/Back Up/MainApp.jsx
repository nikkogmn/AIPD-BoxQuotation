import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Copy, Edit, Plus, Save, X, AlertCircle, FileText, User, Box, Grid, Palette, Eye, Ruler, StickyNote, Layers, DollarSign, Truck, ArrowLeftRight, Droplet, Scissors, Shield, Settings, FileInput, Users, Database, Globe, Briefcase, Search, CheckCircle, FilePlus, ChevronLeft, Calculator, Percent, CreditCard, Package } from 'lucide-react';

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc ,setDoc, getDoc } from "firebase/firestore";
// เพิ่มคำสั่งอัปโหลดไฟล์จาก Firebase Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
// อย่าลืมดึง storage มาจากไฟล์ firebase.js ด้วย
import { db, storage } from './firebase';
// --- Constants ---
import { generateQuotationPDF } from './services/pdfGenerator'; // เช็ค Path ให้ตรงกับที่คุณสร้างไฟล์ด้วยนะครับ
// ถ้าโปรเจกต์คุณไม่ได้ใช้ react-icons ก็ข้ามบรรทัด FiDownload ไปได้เลยครับ ใช้เป็นรูป 📄 หรือ SVG ของคุณเองได้
const INDUSTRY_TYPES = [
    "ผลไม้สด (Fresh Fruit)",
    "ผลไม้แปรรูป/อบแห้ง (Processed/Dried Fruit)",
    "อาหารกระป๋อง (Canned Food)",
    "อาหารแช่แข็ง (Frozen Food)",
    "เครื่องดื่ม (Beverages)",
    "ขนมขบเคี้ยว (Snacks)",
    "เคมีเกษตร (Agrochemicals)",
    "ปุ๋ยและอาหารสัตว์ (Fertilizers & Animal Feed)",
    "เมล็ดพันธุ์พืช (Seeds)",
    "เครื่องสำอาง (Cosmetics)",
    "เวชสำอาง/สกินแคร์ (Skincare)",
    "อาหารเสริม (Supplements)",
    "ยาและเวชภัณฑ์ (Pharmaceuticals)",
    "อุปกรณ์ทางการแพทย์ (Medical Devices)",
    "ของเล่น (Toys)",
    "สินค้าแม่และเด็ก (Mother & Baby)",
    "เครื่องเขียน/อุปกรณ์สำนักงาน (Stationery)",
    "สิ่งพิมพ์/บรรจุภัณฑ์ (Printing & Packaging)",
    "เสื้อผ้า/เครื่องนุ่งห่ม (Apparel)",
    "รองเท้าและกระเป๋า (Shoes & Bags)",
    "ชิ้นส่วนยานยนต์ (Auto Parts)",
    "อิเล็กทรอนิกส์ (Electronics)",
    "เครื่องใช้ไฟฟ้า (Home Appliances)",
    "เฟอร์นิเจอร์ (Furniture)",
    "ของตกแต่งบ้าน (Home Decor)",
    "เซรามิก/เครื่องแก้ว (Ceramics & Glass)",
    "พลาสติกและยาง (Plastic & Rubber)",
    "วัสดุก่อสร้าง (Construction Materials)",
    "โลจิสติกส์/ขนส่ง (Logistics)",
    "อีคอมเมิร์ซ (E-commerce)",
    "สินค้าอุปโภคบริโภคทั่วไป (FMCG)",
    "อื่นๆ (Other)"
];

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, title, disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    outline: "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50",
    icon: "p-2 hover:bg-gray-100 rounded-full text-gray-600"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`} title={title}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, required = false, type = "text", helpText, readOnly = false, options = [], min, step, suffix }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
        {type === 'textarea' ? (
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                placeholder={placeholder}
                rows={3}
                readOnly={readOnly}
            />
        ) : type === 'select' ? (
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                disabled={readOnly}
            >
                <option value="">-- กรุณาเลือก --</option>
                {options.map((opt, idx) => {
                    const val = typeof opt === 'object' ? opt.value : opt;
                    const lab = typeof opt === 'object' ? opt.label : opt;
                    return <option key={idx} value={val}>{lab}</option>;
                })}
            </select>
        ) : type === 'color' ? (
            <div className="flex gap-2 items-center">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-12 h-10 p-0 border border-gray-300 rounded cursor-pointer"
                    disabled={readOnly}
                />
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="#000000"
                    readOnly={readOnly}
                />
            </div>
        ) : (
            <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
            placeholder={placeholder}
            readOnly={readOnly}
            min={min}
            step={step}
            />
        )}
        {suffix && <span className="absolute right-3 top-2.5 text-gray-500 text-sm">{suffix}</span>}
    </div>
    
    {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
  </div>
);

const Modal = ({ isOpen, title, onClose, children, footer, size = 'md' }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    md: 'max-w-lg',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} overflow-hidden animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]`}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto grow">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Box Schematic Component (Updated for better visibility)
const BoxSchematic = ({ codeName, globalName, dimensions = {}, baseType }) => {
  const isFOL = baseType === 'FOL' || globalName?.toLowerCase().includes('overlap') || codeName?.toLowerCase().includes('fol');
  
  const wG = 40;  
  const wW = 120; 
  const wD = 140; 
  const hMain = 200; 
  
  // สร้างความแตกต่าง: RSC ฝายาวครึ่งนึง (D/2) | FOL ฝายาวเต็มความลึก (D)
  const hFlap = isFOL ? wD : wD / 2;
  
  // Calculate total diagram size
  const totalW = wG + (2 * wW) + (2 * wD);
  const totalH = hMain + (2 * hFlap);
  
  // Margins for labels
  const marginX = 80;
  const marginY = 80;

  const viewBoxWidth = totalW + (marginX * 2);
  const viewBoxHeight = totalH + (marginY * 2);
  
  const startX = marginX;
  const startY = marginY + hFlap;

  // Points calculation
  const xG = startX;
  const xW1 = xG + wG;
  const xD1 = xW1 + wW;
  const xW2 = xD1 + wD;
  const xD2 = xW2 + wW;
  const xEnd = xD2 + wD;

  // Format label helper
  const formatLabel = (label, val) => {
      return val ? `${label}: ${val}` : label;
  };

  const DimLineH = ({ x1, x2, y, text, color="#64748b" }) => (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      <line x1={x1} y1={y-5} x2={x1} y2={y+5} stroke={color} strokeWidth="1" />
      <line x1={x2} y1={y-5} x2={x2} y2={y+5} stroke={color} strokeWidth="1" />
      <rect x={(x1+x2)/2 - 35} y={y-12} width="70" height="24" fill="white" fillOpacity="0.95" rx="4" stroke="#e2e8f0" strokeWidth="0.5"/>
      <text x={(x1+x2)/2} y={y+5} className="text-sm font-bold" fill={color} textAnchor="middle">{text}</text>
    </g>
  );

  const DimLineV = ({ x, y1, y2, text, color="#64748b" }) => (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      <line x1={x-5} y1={y1} x2={x+5} y2={y1} stroke={color} strokeWidth="1" />
      <line x1={x-5} y1={y2} x2={x+5} y2={y2} stroke={color} strokeWidth="1" />
      <rect x={x-35} y={(y1+y2)/2 - 12} width="70" height="24" fill="white" fillOpacity="0.95" rx="4" stroke="#e2e8f0" strokeWidth="0.5"/>
      <text x={x} y={(y1+y2)/2 + 5} className="text-sm font-bold" fill={color} textAnchor="middle">{text}</text>
    </g>
  );

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm mb-4 w-full flex justify-center bg-grid-pattern overflow-hidden">
        <svg 
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
            className="w-full h-auto max-h-[500px]"
            preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f8fafc" strokeWidth="1"/>
            </pattern>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#64748b" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <g>
            {/* Glue Tab (G) */}
            <path d={`M${xG},${startY} L${xW1},${startY+10} L${xW1},${startY+hMain-10} L${xG},${startY+hMain} Z`} fill="#e2e8f0" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2"/>
            
            {/* Panel 1 (W) - Left */}
            <rect x={xW1} y={startY - hFlap} width={wW} height={hFlap} fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
            <rect x={xW1} y={startY} width={wW} height={hMain} fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
            <rect x={xW1} y={startY + hMain} width={wW} height={hFlap} fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
            <text x={xW1 + wW/2} y={startY + hMain/2} className="text-2xl font-bold fill-blue-400 opacity-40" textAnchor="middle">W</text>

            {/* Panel 2 (D) - Front */}
            <rect x={xD1} y={startY - hFlap} width={wD} height={hFlap} fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
            <rect x={xD1} y={startY} width={wD} height={hMain} fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <rect x={xD1} y={startY + hMain} width={wD} height={hFlap} fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
            <text x={xD1 + wD/2} y={startY + hMain/2} className="text-2xl font-bold fill-green-400 opacity-40" textAnchor="middle">D</text>

            {/* Panel 3 (W) - Right */}
            <rect x={xW2} y={startY - hFlap} width={wW} height={hFlap} fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
            <rect x={xW2} y={startY} width={wW} height={hMain} fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
            <rect x={xW2} y={startY + hMain} width={wW} height={hFlap} fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
            <text x={xW2 + wW/2} y={startY + hMain/2} className="text-2xl font-bold fill-blue-400 opacity-40" textAnchor="middle">W</text>

             {/* Panel 4 (D) - Back */}
            <rect x={xD2} y={startY - hFlap} width={wD} height={hFlap} fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
            <rect x={xD2} y={startY} width={wD} height={hMain} fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <rect x={xD2} y={startY + hMain} width={wD} height={hFlap} fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
            <text x={xD2 + wD/2} y={startY + hMain/2} className="text-2xl font-bold fill-green-400 opacity-40" textAnchor="middle">D</text>
          </g>

          {/* Dimension Lines (Bottom) */}
          <g transform={`translate(0, ${startY + hMain + hFlap + 40})`}>
             <DimLineH x1={xG} x2={xW1} y={0} text={formatLabel("G", dimensions.G)} color="#64748b" />
             <DimLineH x1={xW1} x2={xD1} y={0} text={formatLabel("W", dimensions.W)} color="#3b82f6" />
             <DimLineH x1={xD1} x2={xW2} y={0} text={formatLabel("D", dimensions.D)} color="#22c55e" />
             <DimLineH x1={xW2} x2={xD2} y={0} text={formatLabel("W", dimensions.W)} color="#3b82f6" />
             <DimLineH x1={xD2} x2={xEnd} y={0} text={formatLabel("D", dimensions.D)} color="#22c55e" />
          </g>

          {/* Dimension Lines (Right) */}
           <g transform={`translate(${xEnd + 50}, ${startY})`}>
              <DimLineV x={0} y1={-hFlap} y2={0} text={isFOL ? formatLabel("D", dimensions.D) : formatLabel("D/2", dimensions.D ? dimensions.D/2 : null)} color="#22c55e" />
              <DimLineV x={0} y1={0} y2={hMain} text={formatLabel("H", dimensions.H)} color="#ef4444" />
              <DimLineV x={0} y1={hMain} y2={hMain+hFlap} text={isFOL ? formatLabel("D", dimensions.D) : formatLabel("D/2", dimensions.D ? dimensions.D/2 : null)} color="#22c55e" />
              <DimLineV x={60} y1={-hFlap} y2={hMain+hFlap} text="Total H" color="#000" />
           </g>
        </svg>
      </div>

      {/* Description Panel */}
      <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Ruler size={16} /> 
            คำอธิบายตัวแปร (Variable Definitions)
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="font-medium">W (Width):</span>
                <span className="text-gray-600">ความกว้าง {dimensions.W && `(${dimensions.W})`}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="font-medium">D (Depth):</span>
                <span className="text-gray-600">ความลึก (ข้าง) {dimensions.D && `(${dimensions.D})`}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="font-medium">H (Height):</span>
                <span className="text-gray-600">ความสูง {dimensions.H && `(${dimensions.H})`}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                <span className="font-medium">G (Glue):</span>
                <span className="text-gray-600">ลิ้นกาว {dimensions.G && `(${dimensions.G})`}</span>
            </div>
             <div className="flex items-center gap-2 col-span-2 bg-yellow-50 p-1 rounded border border-yellow-200">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="font-medium text-yellow-800">M (Margin):</span>
                <span className="text-yellow-800">ระยะเผื่อรอยพับ {dimensions.M && `(${dimensions.M})`}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Helpers ---
const getColorFromCode = (code) => {
    const map = {
        'KA': '#d4a373', 'KI': '#e9d8a6', 'KS': '#fefae0', 'CA': '#bc6c25', 'W': '#ffffff',
    };
    return map[code?.toUpperCase()] || '#cbd5e1'; 
};

const getDateTime = () => {
    const now = new Date();
    return `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

const formatDimension = (valueStr, unit) => {
    if (!valueStr) return '';
    const values = valueStr.toString().split(',').map(v => parseFloat(v.trim()));
    if (unit === 'cm') return values.join(', ');
    return values.map(v => (v / 2.54).toFixed(1)).join(', ');
};

const convertToDisplay = (value, unit) => {
    if (!value) return '-';
    if (unit === 'cm') return value;
    return (value / 2.54).toFixed(2);
};

// --- Main Application ---

export default function MainApp({ userRole , userEmail}){
  const [activeMainTab, setActiveMainTab] = useState('quotation'); 
  const [activeSubTab, setActiveSubTab] = useState('customer'); 
  const [currentUnit, setCurrentUnit] = useState('cm'); 
  const [showCostCalc, setShowCostCalc] = useState(false); 
  const [collapsedItems, setCollapsedItems] = useState({}); // 🌟 เพิ่มบรรทัดนี้: เก็บสถานะการย่อ/ขยายของแต่ละกล่อง
   // --- เพิ่ม State สำหรับข้อมูลบริษัท ตรงนี้เลยครับ 👇 ---
  const defaultCompanyState = {
      nameTH: '', nameEN: '',
      addressTH: '', addressEN: '',
      taxId: '', phone: '',
      approverTH: '', approverEN: '',
      signatureUrl: '',
      logoUrl: '', // <--- เพิ่มโลโก้ตรงนี้
      auditLogs: []
  };
  const [companyData, setCompanyData] = useState(defaultCompanyState);
  const [originalCompanyData, setOriginalCompanyData] = useState(defaultCompanyState);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isUploadingSig, setIsUploadingSig] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false); // <--- เพิ่ม State Loading สำหรับโลโก้
  // --- Data States ---

  // 1. Box Styles
  const [boxStyles, setBoxStyles] = useState([
    /*{
      id: 1,
      codeName: 'RSC-01',
      globalName: 'Regular Slotted Container',
      formula: '(2*W + 2*D + G + 4*M) * (H + D + 2*M)',
      note: 'กล่องมาตรฐานที่นิยมใช้มากที่สุด',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/RSC_Box_Die_Cut.svg/320px-RSC_Box_Die_Cut.svg.png',
      createdBy: 'Admin',
      createdDate: '2023-10-01 10:00',
      lastModifiedBy: 'Admin',
      lastModifiedDate: '2023-10-05 14:30'
    },
    {
      id: 2,
      codeName: 'FOL-01',
      globalName: 'Full Overlap Slotted Container',
      formula: '(2*W + 2*D + G + 4*M) * (H + 2*D + 2*M)',
      note: 'กล่องฝาชนทับกัน เหมาะสำหรับสินค้าหนัก',
      imageUrl: '', 
      createdBy: 'Admin',
      createdDate: '2023-10-26 09:15',
      lastModifiedBy: 'Admin',
      lastModifiedDate: '2023-10-26 11:45'
    }*/
  ]);

  // 2. Paper Types
  const [paperTypes, setPaperTypes] = useState([
    /*{
        id: 1,
        codeName: 'P-KA125-B',
        globalName: 'KA125/CA105 B-Flute',
        flute: 'B',
        wallType: 'Single Wall',
        materialCode: 'KA',
        widths: '120, 125, 150, 160, 175', 
        price: 15.50,
        moq: 500,
        supplier: 'Siam Kraft',
        note: 'เกรดมาตรฐานสีทอง',
        createdBy: 'Admin',
        createdDate: '2023-11-01 08:30',
        lastModifiedBy: 'Admin',
        lastModifiedDate: '2023-11-01 08:30'
    },
    {
        id: 2,
        codeName: 'P-KS170-C',
        globalName: 'KS170/CA125 C-Flute',
        flute: 'C',
        wallType: 'Single Wall',
        materialCode: 'KS',
        widths: '115, 140, 165',
        price: 22.00,
        moq: 1000,
        supplier: 'Thai Paper',
        note: 'ผิวขาว สวยงาม',
        createdBy: 'Purchasing',
        createdDate: '2023-11-02 10:15',
        lastModifiedBy: 'Admin',
        lastModifiedDate: '2023-11-03 16:20'
    }*/
  ]);

  // 3. Printing Blocks
  const [printBlocks, setPrintBlocks] = useState([
     /* {
          id: 1,
          codeName: 'BLK-RB-S',
          globalName: 'Rubber Block Small (Carved)',
          material: 'บล็อคแกะ (Rubber)',
          maxWidth: 30, 
          maxLength: 30, 
          price: 500.00,
          moq: 1,
          supplier: 'Local Block Shop',
          note: 'สำหรับโลโก้ขนาดเล็ก',
          createdBy: 'Admin',
          createdDate: '2023-11-15 09:00',
          lastModifiedBy: 'Admin',
          lastModifiedDate: '2023-11-15 09:00'
      },
      {
          id: 2,
          codeName: 'BLK-PM-L',
          globalName: 'Polymer Block Large',
          material: 'บล็อคหล่อ (Polymer)',
          maxWidth: 50, 
          maxLength: 50, 
          price: 1500.00,
          moq: 1,
          supplier: 'Hi-Tech Block',
          note: 'สำหรับงานละเอียด',
          createdBy: 'Admin',
          createdDate: '2023-11-15 09:30',
          lastModifiedBy: 'Admin',
          lastModifiedDate: '2023-11-15 09:30'
      }*/
  ]);

  // 4. Printing Colors
  const [printColors, setPrintColors] = useState([
     /* { id: 1, codeName: 'INK-C', globalName: 'Cyan Process', clmvCode: '#00FFFF', price: 250, moq: 5, supplier: 'Toyo Ink', note: 'สีฟ้าแม่สี', createdBy: 'Admin', createdDate: '2023-11-20 08:00', lastModifiedBy: 'Admin', lastModifiedDate: '2023-11-20 08:00' },
      { id: 2, codeName: 'INK-M', globalName: 'Magenta Process', clmvCode: '#FF00FF', price: 250, moq: 5, supplier: 'Toyo Ink', note: 'สีแดงม่วงแม่สี', createdBy: 'Admin', createdDate: '2023-11-20 08:05', lastModifiedBy: 'Admin', lastModifiedDate: '2023-11-20 08:05' },
      { id: 3, codeName: 'INK-K', globalName: 'Black Process', clmvCode: '#000000', price: 200, moq: 5, supplier: 'Toyo Ink', note: 'สีดำแม่สี', createdBy: 'Admin', createdDate: '2023-11-20 08:10', lastModifiedBy: 'Admin', lastModifiedDate: '2023-11-20 08:10' },*/
  ]);

  // 5. Die Cut Molds
  const [dieCutMolds, setDieCutMolds] = useState([
     /* {
          id: 1,
          codeName: 'DIE-ROT-STD',
          globalName: 'Rotary Die Cut - Standard',
          maxWidth: 160,
          maxLength: 280,
          price: 15000.00,
          moq: 1,
          supplier: 'Thai Diecut Co.',
          note: 'แม่พิมพ์โรตารี่',
          createdBy: 'Admin',
          createdDate: '2023-12-01 09:00',
          lastModifiedBy: 'Admin',
          lastModifiedDate: '2023-12-01 09:00'
      } */
  ]);

  // 6. Admins
  const [admins, setAdmins] = useState([
      /*{
          id: 1,
          email: 'admin@system.com',
          tier: 'Level 1',
          note: 'Super Admin - ดูแลระบบทั้งหมด',
          createdBy: 'System',
          createdDate: '2023-01-01 00:00',
          lastModifiedBy: 'System',
          lastModifiedDate: '2023-01-01 00:00'
      }*/
  ]);

  // 7. Customers
  const [customers, setCustomers] = useState([
      /*{
          id: 1,
          name: 'เจ๊แต๋ว ผลไม้สด',
          company: 'บจก. ผลไม้ไทยรุ่งเรือง',
          taxId: '0105551234567',
          addressShip: '88/9 ตลาดไท ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120',
          addressBill: '88/9 ตลาดไท ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120',
          mobile1: '081-234-5678',
          mobile2: '089-987-6543',
          industry: 'ผลไม้สด (Fresh Fruit)',
          note: 'ลูกค้าเก่าแก่ ส่งของก่อน 6 โมงเช้า',
          createdBy: 'Sales1',
          createdDate: '2023-12-01 10:00',
          lastModifiedBy: 'Sales1',
          lastModifiedDate: '2023-12-01 10:00'
      }*/
  ]);
  // --- Firebase Data Fetching ---
// --- Firebase Data Fetching (Universal) ---
const fetchAllMasterData = async () => {
    const fetchCollection = async (collectionName, setterFunction) => {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const loadedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setterFunction(loadedData);
        } catch (error) {
            console.error(`โหลดข้อมูล ${collectionName} ไม่สำเร็จ: `, error);
        }
    };

    const fetchCompanyData = async () => {
        try {
            const docSnap = await getDoc(doc(db, "appSettings", "companyProfile"));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCompanyData(data);
                setOriginalCompanyData(data);
            }
        } catch (error) { console.error("โหลดข้อมูลบริษัทไม่สำเร็จ", error); }
    };

    // 🌟 1. เพิ่มฟังก์ชันดึงข้อมูลใบเสนอราคาตรงนี้ 🌟
// 🌟 1. ฟังก์ชันดึงข้อมูลใบเสนอราคา
    const fetchQuotations = async () => {
        try {
            const qSnap = await getDocs(collection(db, "quotations"));
            
            // 👉 แก้บรรทัดนี้: สลับเอา ...doc.data() ขึ้นก่อน แล้วเอา id: doc.id ไว้ด้านหลังสุด
            const quots = qSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            
            // เรียงลำดับจากใหม่ไปเก่า
            quots.sort((a, b) => new Date(b.lastModifiedDate || b.createdDate || 0) < new Date(a.lastModifiedDate || a.createdDate || 0) ? 1 : -1);
            setQuotationList(quots);
        } catch (error) { console.error("โหลดข้อมูลใบเสนอราคาไม่สำเร็จ", error); }
    };

    // 🌟 2. สั่งให้โหลด fetchQuotations พร้อมกับ Master Data ตัวอื่นๆ 🌟
    await Promise.all([
        fetchCollection("customers", setCustomers),
        fetchCollection("boxStyles", setBoxStyles),
        fetchCollection("paperTypes", setPaperTypes),
        fetchCollection("printBlocks", setPrintBlocks),
        fetchCollection("printColors", setPrintColors),
        fetchCollection("dieCutMolds", setDieCutMolds),
        fetchCollection("admins", setAdmins),
        fetchCompanyData(),
        fetchQuotations() // <--- เติมตรงนี้เพื่อให้โหลดข้อมูลขึ้นตารางทันทีที่เปิดแอป
    ]);
  };

  useEffect(() => {
    fetchAllMasterData();
  }, []);
  // 8. Quotations
 const [quotationView, setQuotationView] = useState('list'); 
 const [quotationList, setQuotationList] = useState([]);
// --- โครงสร้างพื้นฐานสำหรับ 1 รายการกล่อง (หมวด 2, 3, 4 รวมกัน) ---
  const defaultQuotItem = {
      id: Date.now(), // จำเป็นต้องมี id เพื่อให้ React แยกแยะกล่องแต่ละใบได้
      boxStyleId: '', paperTypeId: '',
      dimW: '', dimD: '', dimH: '', dimG: '3', dimM: '0.5',
      printType: 'none', printColorId1: '', printColorId2: '', printBlocks1: [], printBlocks2: [], printCostPerBox: 0,
      dieCutId: '', dieCutW: '', dieCutL: '',
      quantity: 1000 // จำนวนย้ายมาอยู่ในระดับรายการ เพื่อให้แต่ละกล่องสั่งจำนวนไม่เท่ากันได้
  };

  // --- State หลักของใบเสนอราคา ---
const [currentQuot, setCurrentQuot] = useState({
      id: null, quotationNo: '', revision: 0,
      customerId: '', customerName: '',
      items: [{ ...defaultQuotItem }], 
      leadTime: 14, shippingType: 'pickup', shippingCost: 0, setupCost: 0, profitMarginBox: 50, profitMarginBlock: 20, profitMarginDieCut: 20, discount: 0,
      displayMode: 'per-box' // 🌟 1. เพิ่มบรรทัดนี้เข้าไป
  });

  const [modalMode, setModalMode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  // 🌟 จุดที่ 1: เพิ่ม State สำหรับ Bulk Import
  const [bulkImportData, setBulkImportData] = useState({ rawText: '', supplier: '', note: '', flute: 'B', wallType: 'Single Wall', widths: '', suffix: '' });
  const [isUploading, setIsUploading] = useState(false); // <--- เพิ่มบรรทัดนี้เพื่อทำ Loading รูประหว่างอัปโหลด
  // --- Logic for Blocks ---
// --- ฟังก์ชันจัดการรายการกล่อง (Add/Remove/Update Item) ---
  const handleAddItem = () => {
      setCurrentQuot(prev => ({ ...prev, items: [...prev.items, { ...defaultQuotItem, id: Date.now() }] }));
  };

  const handleRemoveItem = (indexToRemove) => {
      setCurrentQuot(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== indexToRemove) }));
  };

  const handleUpdateItem = (index, field, value) => {
      const newItems = [...currentQuot.items];
      newItems[index][field] = value;
      setCurrentQuot({ ...currentQuot, items: newItems });
  };

  // --- ฟังก์ชันจัดการบล็อคพิมพ์ (อัปเดตให้รองรับ Multi-items) ---
  const handleAddBlock = (itemIndex, colorIndex) => {
      const field = colorIndex === 1 ? 'printBlocks1' : 'printBlocks2';
      const newItems = [...currentQuot.items];
      if (newItems[itemIndex][field].length >= 30) return alert("สูงสุด 30 แบบพิมพ์ต่อสี");
      
      newItems[itemIndex][field].push({ id: Date.now(), typeId: '', w: 0, l: 0, price: 0 });
      setCurrentQuot({ ...currentQuot, items: newItems });
  };

  const handleUpdateBlock = (itemIndex, colorIndex, blockId, field, value) => {
      const stateField = colorIndex === 1 ? 'printBlocks1' : 'printBlocks2';
      const newItems = [...currentQuot.items];
      
      newItems[itemIndex][stateField] = newItems[itemIndex][stateField].map(b => {
          if (b.id === blockId) {
              const updatedB = { ...b, [field]: value };
              if (field === 'typeId' || field === 'w' || field === 'l') {
                  const tId = field === 'typeId' ? value : b.typeId;
                  const w = field === 'w' ? parseFloat(value) || 0 : parseFloat(b.w) || 0;
                  const l = field === 'l' ? parseFloat(value) || 0 : parseFloat(b.l) || 0;
                  const blockType = printBlocks.find(pb => pb.id.toString() === tId.toString());
                  updatedB.price = blockType ? (w * l) * parseFloat(blockType.price || 0) : 0;
              }
              return updatedB;
          }
          return b;
      });
      setCurrentQuot({ ...currentQuot, items: newItems });
  };

  const handleRemoveBlock = (itemIndex, colorIndex, blockId) => {
      const field = colorIndex === 1 ? 'printBlocks1' : 'printBlocks2';
      const newItems = [...currentQuot.items];
      newItems[itemIndex][field] = newItems[itemIndex][field].filter(b => b.id !== blockId);
      setCurrentQuot({ ...currentQuot, items: newItems });
  };



// --- Calculation Logic (รองรับ Multi-items กล่องหลายใบ) ---
// --- Calculation Logic (Multi-items) ---
// --- Calculation Logic (รองรับกำไรแยกประเภท) ---
  const calculateTotals = () => {
      let totalBoxCost = 0; 
      let totalBlockCost = 0; 
      let totalDieCutCost = 0;
      let itemsDetail = [];

      const marginBox = (parseFloat(currentQuot.profitMarginBox) || 0) / 100;
      const marginBlock = (parseFloat(currentQuot.profitMarginBlock) || 0) / 100;
      const marginDieCut = (parseFloat(currentQuot.profitMarginDieCut) || 0) / 100;

      (currentQuot.items || []).forEach(item => {
          const W = parseFloat(item.dimW) || 0; const D = parseFloat(item.dimD) || 0;
          const H = parseFloat(item.dimH) || 0; const G = parseFloat(item.dimG) || 0; const M = parseFloat(item.dimM) || 0;
          
          const paper = paperTypes.find(p => p.id?.toString() === item.paperTypeId?.toString());
          const selBox = boxStyles.find(b => b.id?.toString() === item.boxStyleId?.toString());
          
          let areaSqCm = 0;
          let safeFormula = "ไม่มีสูตร";
          if (selBox && selBox.formula) {
              try {
                  safeFormula = selBox.formula.replace(/(\d)([WDHGM])/gi, '$1*$2');
                  const calcArea = new Function('W', 'D', 'H', 'G', 'M', `return ${safeFormula};`);
                  areaSqCm = calcArea(W, D, H, G, M);
                  if (isNaN(areaSqCm) || areaSqCm < 0) areaSqCm = 0;
              } catch (e) { areaSqCm = 0; }
          }
          
          const areaSqFt = areaSqCm / 929.0304; 
          // 🌟 4. ดึงราคาจากที่ Snapshot ไว้ก่อน ถ้าไม่มีค่อยไปดึงจาก Master
          const pPrice = item.paperPriceSnapshot !== undefined ? parseFloat(item.paperPriceSnapshot) : (paper ? parseFloat(paper.price) : 0);
          
          // 1. ต้นทุนกล่องและสี
          const rawBoxCost = (areaSqFt * pPrice) + (parseFloat(item.printCostPerBox) || 0);
          const sellBoxCost = rawBoxCost + (rawBoxCost * marginBox); // บวกกำไร

          // 2. ต้นทุนบล็อคพิมพ์
          const blockCost = (item.printBlocks1 || []).reduce((s, b) => s + (parseFloat(b.price) || 0), 0) + (item.printBlocks2 || []).reduce((s, b) => s + (parseFloat(b.price) || 0), 0);
          const sellBlockCost = blockCost + (blockCost * marginBlock); // บวกกำไร

          // 3. ต้นทุนใบมีด
          let dieCutCost = 0; 
          if (item.dieCutId && item.dieCutW && item.dieCutL) {
              const mold = dieCutMolds.find(d => d.id?.toString() === item.dieCutId?.toString());
              dieCutCost = (parseFloat(item.dieCutW) || 0) * (parseFloat(item.dieCutL) || 0) * (mold ? parseFloat(mold.price) : 0); 
          }
          const sellDieCutCost = dieCutCost + (dieCutCost * marginDieCut); // บวกกำไร

          const qty = parseInt(item.quantity) || 1;
          
          totalBoxCost += (rawBoxCost * qty);
          totalBlockCost += blockCost;
          totalDieCutCost += dieCutCost;

          // สร้าง Detail เพื่อโชว์ในหน้าจอ (โชว์ราคาที่บวกกำไรแล้ว)
          const blockDetails = [
              ...(item.printBlocks1 || []).map(b => ({ name: 'บล็อคพิมพ์ (สี 1)', size: `${b.w}x${b.l}`, price: parseFloat(b.price || 0) * (1 + marginBlock) })),
              ...(item.printBlocks2 || []).map(b => ({ name: 'บล็อคพิมพ์ (สี 2)', size: `${b.w}x${b.l}`, price: parseFloat(b.price || 0) * (1 + marginBlock) }))
          ];

          itemsDetail.push({
              formulaStr: selBox?.formula, safeFormula, areaSqCm, areaSqFt, paperPrice: pPrice,
              boxCost: sellBoxCost, // ราคาขาย
              blockCost: sellBlockCost, // ราคาขาย
              dieCutCost: sellDieCutCost, // ราคาขาย
              qty,
              boxName: selBox?.codeName || 'ไม่ระบุรูปแบบ',
              dim: `${W}x${D}x${H}`,
              blockDetails,
              dieCutDetail: item.dieCutId ? { size: `${item.dieCutW}x${item.dieCutL}`, price: sellDieCutCost } : null
          });
      });

      // ค่าใช้จ่ายส่วนกลาง (ไม่มีกำไร)
      const shipCost = currentQuot.shippingType === 'delivery' ? (parseFloat(currentQuot.shippingCost) || 0) : 0;
      const setup = parseFloat(currentQuot.setupCost) || 0;
      
      const grandTotalRawCost = totalBoxCost + totalBlockCost + totalDieCutCost + shipCost + setup;
      
      // ยอดรวมหลังบวกกำไรแต่ละส่วน
      const profitBoxAmt = totalBoxCost * marginBox;
      const profitBlockAmt = totalBlockCost * marginBlock;
      const profitDieCutAmt = totalDieCutCost * marginDieCut;
      const totalProfitAmount = profitBoxAmt + profitBlockAmt + profitDieCutAmt;
      
      const totalWithProfit = grandTotalRawCost + totalProfitAmount;

      // ส่วนลดคิดจากยอดที่บวกกำไรแล้ว
      const discountAmount = totalWithProfit * ((parseFloat(currentQuot.discount) || 0) / 100);
      const totalAfterDiscount = totalWithProfit - discountAmount;

      const vat = totalAfterDiscount * 0.07;
      const netTotal = totalAfterDiscount + vat;

      return {
          itemsDetail,
          totalBoxCost, totalBlockCost, totalDieCutCost,
          shipCost, setupCost: setup,
          grandTotalRawCost, totalProfitAmount, totalWithProfit, totalAfterDiscount, netTotal
      };
  };
  const totals = useMemo(() => calculateTotals(), [currentQuot, paperTypes, boxStyles, dieCutMolds, printBlocks]);

  
// --- ฟังก์ชันจัดฟอร์แมตวันที่แบบ ddMMMyyyy (เช่น 03Mar2026) ---
  const formatQuotDateForName = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getDate()).padStart(2, '0');
      return `${day}${months[d.getMonth()]}${d.getFullYear()}`;
  };

// --- ฟังก์ชันสร้างชื่อใบเสนอราคาอัตโนมัติ (แยกเป็น 2 บรรทัด) ---
  const generateQuotName = (quot) => {
      const cusName = customers.find(c => c.id === quot.customerId)?.name || 'ไม่ระบุลูกค้า';
      const itemCount = quot.items ? quot.items.length : 0;
      
      // ส่งค่ากลับไปเป็น Object เพื่อให้ตารางเอาไปจัด 2 บรรทัด
      return {
          line1: `${cusName} (${itemCount} รายการ)`,
          line2: quot.quotationNo || 'ยังไม่มีเลขที่เอกสาร'
      };
  };

  // --- รายการสถานะของใบเสนอราคา ---
  const quotationStatuses = [
      "0.แบบร่าง", 
      "1.รอการตรวจสอบ", 
      "2.พร้อมเสนอลูกค้า", 
      "3.1สั่งผลิต", 
      "3.2 ปิดรายการ"
  ];

// --- ฟังก์ชันเปลี่ยนสถานะ (Update Status) ผ่านตาราง ---
  const handleStatusChange = async (id, newStatus, currentStatus) => {
      // 1. เช็คสิทธิ์: ถ้าจะเปลี่ยนเป็น '2' หรือ '3.1' ต้องเป็น Level 1 หรือ 2 เท่านั้น
      if (newStatus.startsWith('2') || newStatus.startsWith('3.1')) {
          if (userRole !== 'Level 1' && userRole !== 'Level 2') {
              alert("⚠️ ปฏิเสธการทำรายการ: เฉพาะ Admin (Level 1, 2) เท่านั้นที่สามารถอนุมัติ 'พร้อมเสนอลูกค้า' หรือ 'สั่งผลิต' ได้");
              return; // หยุดการทำงานทันที
          }
      }

      // 2. เด้งหน้าต่างยืนยัน (Confirmation)
      const confirmMsg = `คุณต้องการเปลี่ยนสถานะใบเสนอราคานี้เป็น "${newStatus}" ใช่หรือไม่?`;
      if (!window.confirm(confirmMsg)) {
          return; // ถ้ากดยกเลิก ให้หยุดทำงาน (Dropdown จะเด้งกลับไปค่าเดิมอัตโนมัติ)
      }

      // 3. ถ้ากดยืนยัน และสิทธิ์ผ่าน ให้บันทึกข้อมูล
      try {
          await updateDoc(doc(db, "quotations", id), {
              status: newStatus,
              lastModifiedBy: userEmail,
              lastModifiedDate: getDateTime()
          });
          // อัปเดตข้อมูลบนหน้าจอทันที
          setQuotationList(prev => prev.map(q => 
              q.id === id ? { ...q, status: newStatus, lastModifiedBy: userEmail, lastModifiedDate: getDateTime() } : q
          ));
      } catch (error) {
          alert("อัปเดตสถานะไม่สำเร็จ: " + error.message);
      }
  };

// --- ฟังก์ชันลบใบเสนอราคา --- (ของคุณมีอยู่แล้ว)
  const handleDeleteQuotation = async (id) => {
      if(window.confirm('ยืนยันการลบใบเสนอราคานี้? (ลบแล้วกู้คืนไม่ได้)')) {
          try {
              await deleteDoc(doc(db, "quotations", id));
              setQuotationList(prev => prev.filter(q => q.id !== id));
          } catch (error) { alert("ลบข้อมูลไม่สำเร็จ: " + error.message); }
      }
  };

// --- ฟังก์ชันสร้างชื่อไฟล์สำหรับการ Export PDF (ตาม Format เดิมที่ถูกต้อง) ---
  const generateExportFileName = (quot) => {
      // 1. ทำความสะอาดชื่อลูกค้า (ตัดอักขระพิเศษที่ห้ามใช้ในชื่อไฟล์ทิ้ง)
      const rawCusName = customers.find(c => c.id === quot.customerId)?.name || 'UnknownCustomer';
      const safeCusName = rawCusName.replace(/[\\/:*?"<>|]/g, '').trim();

      // 2. หาวันที่สร้างเอกสาร (dd)
      const cDate = quot.createdDate ? new Date(quot.createdDate.replace(' ', 'T')) : new Date();
      const createDay = String(cDate.getDate()).padStart(2, '0');

      // 3. หาวันที่แก้ไขล่าสุด (DDMMMYYYYhhmm)
      const mDate = quot.lastModifiedDate ? new Date(quot.lastModifiedDate.replace(' ', 'T')) : new Date();
      const editDD = String(mDate.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const editMMM = months[mDate.getMonth()]; // เป็นตัวพิมพ์ใหญ่เสมอ
      const editYYYY = mDate.getFullYear();
      const editHH = String(mDate.getHours()).padStart(2, '0');
      const editMin = String(mDate.getMinutes()).padStart(2, '0');

      const lastEditStr = `${editDD}${editMMM}${editYYYY}${editHH}${editMin}`;

      // ผลลัพธ์: AIPD_QUOTATION_ชื่อลูกค้า_ddDDMMMYYYYhhmm
      return `AIPD_QUOTATION_${safeCusName}_${createDay}${lastEditStr}.pdf`; 
  };


// --- ฟังก์ชันดาวน์โหลด PDF (ส่งข้อมูลให้ครบ 6 ลำดับ ป้องกันข้อมูลลูกค้าหาย) ---
// --- ฟังก์ชันดาวน์โหลด PDF (อัปเดตกำไรแยกส่วน) ---
// 🌟 นำไปแทนที่ฟังก์ชัน handleDownloadPDF เดิม 🌟
const handleDownloadPDF = (quot) => {
    console.log("กำลังเตรียมข้อมูลสร้าง PDF...", quot);
    const exportFileName = generateExportFileName(quot);
    const customerFull = customers.find(c => c.id?.toString() === quot.customerId?.toString()) || {};
    const isPerBox = quot.displayMode !== 'detailed';

    const marginBox = (parseFloat(quot.profitMarginBox) || 0) / 100;
    const marginBlock = (parseFloat(quot.profitMarginBlock) || 0) / 100;
    const marginDieCut = (parseFloat(quot.profitMarginDieCut) || 0) / 100;

    let sumSellingPrice = 0;
    const itemsRaw = [];
    
    // Pass 1: คำนวณราคาทั้งหมด
    (quot.items || []).forEach(item => {
        const boxStyle = boxStyles.find(b => b.id?.toString() === item.boxStyleId?.toString());
        const paper = paperTypes.find(p => p.id?.toString() === item.paperTypeId?.toString());
        let areaSqCm = 0;
        if (boxStyle && boxStyle.formula) {
            try {
                let safeFormula = boxStyle.formula.replace(/(\d)([WDHGM])/gi, '$1*$2');
                const calcArea = new Function('W', 'D', 'H', 'G', 'M', `return ${safeFormula};`);
                areaSqCm = calcArea(parseFloat(item.dimW)||0, parseFloat(item.dimD)||0, parseFloat(item.dimH)||0, parseFloat(item.dimG)||0, parseFloat(item.dimM)||0);
                if (isNaN(areaSqCm) || areaSqCm < 0) areaSqCm = 0;
            } catch (e) {}
        }
        const areaSqFt = areaSqCm / 929.0304; 
        // 🌟 4. ดึงราคาจากที่ Snapshot ไว้ก่อน ถ้าไม่มีค่อยไปดึงจาก Master
        const pPrice = item.paperPriceSnapshot !== undefined ? parseFloat(item.paperPriceSnapshot) : (paper ? parseFloat(paper.price) : 0);
        
        const rawBoxCost = (areaSqFt * pPrice) + (parseFloat(item.printCostPerBox) || 0);
        const sellBoxCost = rawBoxCost * (1 + marginBox);
        const blockCost = (item.printBlocks1 || []).reduce((s, b) => s + (parseFloat(b.price) || 0), 0) + (item.printBlocks2 || []).reduce((s, b) => s + (parseFloat(b.price) || 0), 0);
        const sellBlockCost = blockCost * (1 + marginBlock);

        let dieCutCost = 0; 
        if (item.dieCutId && item.dieCutW && item.dieCutL) {
            const mold = dieCutMolds.find(d => d.id?.toString() === item.dieCutId?.toString());
            dieCutCost = (parseFloat(item.dieCutW) || 0) * (parseFloat(item.dieCutL) || 0) * (mold ? parseFloat(mold.price) : 0); 
        }
        const sellDieCutCost = dieCutCost * (1 + marginDieCut);
        const qty = parseInt(item.quantity) || 1;
        const itemSellingTotal = (sellBoxCost * qty) + sellBlockCost + sellDieCutCost;
        
        sumSellingPrice += itemSellingTotal;
        itemsRaw.push({ itemRef: item, sellBoxCost, sellBlockCost, sellDieCutCost, itemSellingTotal, qty });
    });

    const shipCost = quot.shippingType === 'delivery' ? (parseFloat(quot.shippingCost) || 0) : 0;
    const setup = parseFloat(quot.setupCost) || 0;
    const totalWithProfit = sumSellingPrice + setup + shipCost;
    const discountPercent = parseFloat(quot.discount) || 0;
    const totalAfterDiscount = totalWithProfit - (totalWithProfit * (discountPercent / 100));
    const netTotal = totalAfterDiscount * 1.07;
    const factor = totalWithProfit > 0 ? (totalAfterDiscount / totalWithProfit) : 1;

    // Pass 2: เตรียมข้อมูลให้ PDF
    const itemsCalc = itemsRaw.map(raw => {
        const blocks = [...(raw.itemRef.printBlocks1||[]), ...(raw.itemRef.printBlocks2||[])].map(b => ({...b, price: parseFloat(b.price||0) * (1 + marginBlock)}));
        
        // ✨ คำนวณต้นทุนรวมต่อใบ (กระจายค่าจัดส่ง+Setup เข้าไปเนียนๆ)
        const ratio = sumSellingPrice > 0 ? (raw.itemSellingTotal / sumSellingPrice) : 0;
        const itemOverhead = (setup + shipCost) * ratio; 
        const itemTotalWithOverhead = raw.itemSellingTotal + itemOverhead;
        const perBoxFinalTotal = itemTotalWithOverhead * factor; // หักส่วนลดเรียบร้อย

        return {
            boxName: boxStyles.find(b => b.id?.toString() === raw.itemRef.boxStyleId?.toString())?.codeName || 'ไม่ระบุรูปแบบ',
            paperName: paperTypes.find(p => p.id?.toString() === raw.itemRef.paperTypeId?.toString())?.codeName || '-',
            dim: `${raw.itemRef.dimW||0}x${raw.itemRef.dimD||0}x${raw.itemRef.dimH||0}`,
            qty: raw.qty,
            rawBoxCost: raw.sellBoxCost, 
            blocks, 
            dieCutCost: raw.sellDieCutCost,
            dieCutW: raw.itemRef.dieCutW,
            dieCutL: raw.itemRef.dieCutL,
            perBoxFinalTotal 
        };
    });

    const calculatedTotals = { itemsCalc, setupCost: setup, shipCost: shipCost, totalAfterDiscount, netTotal, factor };
    generateQuotationPDF(quot, companyData, calculatedTotals, {}, customerFull, exportFileName);
};

// --- ฟังก์ชันกดแก้ไข (เปิดฟอร์ม) ---
  const handleEditQuotation = (quot) => {
      if(!quot.items) { quot.items = [{...defaultQuotItem}]; }
      setCurrentQuot(quot);
      
      // 🌟 บังคับพับเก็บ (Collapse) ทุกกล่องตอนกดแก้ไข 🌟
      const initialCollapsed = {};
      (quot.items || []).forEach(item => {
          initialCollapsed[item.id] = true;
      });
      setCollapsedItems(initialCollapsed);

      setQuotationView('create'); // สลับไปหน้าฟอร์ม
  };

  // --- ฟังก์ชันกดสร้างใบเสนอราคาใหม่ ---
const handleCreateNewQuot = () => {
      setCurrentQuot({
          id: null, quotationNo: '', revision: 0, customerId: '', customerName: '',
          items: [{ ...defaultQuotItem, id: Date.now() }], 
          leadTime: 14, shippingType: 'pickup', shippingCost: 0, setupCost: 0, profitMarginBox: 50, profitMarginBlock: 20, profitMarginDieCut: 20, discount: 0,
          displayMode: 'per-box' // 🌟 2. เพิ่มตรงนี้ด้วย เพื่อให้ตอนกดสร้างใหม่ ค่าเริ่มต้นเป็นแบบต่อใบ
      });
      setCollapsedItems({}); 
      setQuotationView('create');
  };

  // --- Actions ---

  const handleActionClick = (action, item) => {
    setSelectedItem(item);
    setModalMode(action); 
    if(action === 'edit') {
        setModalMode('confirmEdit');
    }
  };
  
  // --- เปลี่ยนฟังก์ชันให้เป็น async เพื่อให้คุยกับฐานข้อมูลได้ ---
// --- ฟังก์ชันยืนยันการทำรายการ (รองรับ Firebase แบบเต็มรูปแบบสำหรับลูกค้า) ---
// --- ฟังก์ชันยืนยันการทำรายการ (รองรับ Master Data ทุกแท็บ) ---
const handleConfirmAction = async () => {
      let setData;
      const collectionMap = {
          'customer': 'customers',
          'boxStyle': 'boxStyles',
          'paper': 'paperTypes',
          'printBlock': 'printBlocks',
          'printColor': 'printColors',
          'dieCut': 'dieCutMolds'
      };
      
      let targetCollection = collectionMap[activeSubTab];
      
      // 1. ตรวจสอบว่ากำลังอยู่หน้าไหน เพื่อชี้เป้า Database ให้ถูก
      if (activeMainTab === 'admin') {
          targetCollection = 'admins';
          setData = setAdmins;
      } else if (activeMainTab === 'masterData') {
          if (activeSubTab === 'boxStyle') setData = setBoxStyles;
          else if (activeSubTab === 'paper') setData = setPaperTypes;
          else if (activeSubTab === 'printBlock') setData = setPrintBlocks;
          else if (activeSubTab === 'printColor') setData = setPrintColors;
          else if (activeSubTab === 'dieCut') setData = setDieCutMolds;
          else if (activeSubTab === 'customer') setData = setCustomers;
      } else if (activeMainTab === 'quotation' && modalMode.includes('Customer')) {
          targetCollection = 'customers';
          setData = setCustomers;
      }

      if (!setData) return;

      try {
          // ----- 1. ลบข้อมูล (Delete) -----
          if (modalMode === 'delete') {
              if (targetCollection) {
                  await deleteDoc(doc(db, targetCollection, selectedItem.id.toString()));
              }
              setData(prev => prev.filter(i => i.id !== selectedItem.id));
              
              setModalMode(null);
              setSelectedItem(null);
              
          // ----- 2. คัดลอกข้อมูล (Copy) -> เปิดฟอร์มให้แก้ก่อนเซฟจริง -----
          } else if (modalMode === 'copy') {
              const copiedData = { ...selectedItem };
              delete copiedData.id; // ลบ ID ทิ้งเพื่อให้ระบบมองเป็นข้อมูลใหม่
              
              // เติมคำว่า -copy ต่อท้าย เพื่อให้รู้ว่าเป็นตัวที่ก๊อปมา
              if (activeMainTab === 'admin') copiedData.email = `${copiedData.email}-copy`;
              else if (copiedData.codeName) copiedData.codeName = `${copiedData.codeName}-copy`;
              else if (copiedData.name) copiedData.name = `${copiedData.name} (Copy)`;
              
              setFormData(copiedData);
              setModalMode('create'); // เด้งไปหน้า Form
              return; // หยุดการทำงานแค่นี้ ไม่ต้องไปรันโค้ดปิดหน้าต่างด้านล่าง

          // ----- 3. ยืนยันจะแก้ไข (เปิดฟอร์ม Edit) -----
          } else if (modalMode === 'confirmEdit') {
              setFormData({ ...selectedItem }); 
              setModalMode('edit'); 
              return; // เด้งไปหน้า Form แล้วหยุดทำงานแค่นี้

          // ----- 4. บันทึกข้อมูลใหม่ลง Database (Create) -----
          } else if (modalMode === 'confirmSaveCreate' || modalMode === 'confirmSaveCustomerFromQuot') {
              const newItemData = {
                  ...formData,
                  // บังคับอีเมลเป็นพิมพ์เล็กเสมอ
                  ...(activeMainTab === 'admin' && formData.email ? { email: formData.email.toLowerCase() } : {}),
                  createdBy: 'System', 
                  createdDate: getDateTime(), 
                  lastModifiedBy: 'System', 
                  lastModifiedDate: getDateTime(),
              };

              if (targetCollection) {
                  const docRef = await addDoc(collection(db, targetCollection), newItemData);
                  const newRecord = { id: docRef.id, ...newItemData };
                  setData(prev => [...prev, newRecord]);
                  
                  if (modalMode === 'confirmSaveCustomerFromQuot') {
                      setCurrentQuot(prev => ({...prev, customerId: docRef.id}));
                  }
              }
              
              setModalMode(null);
              setSelectedItem(null);
              setFormData({});

          // ----- 5. บันทึกข้อมูลที่แก้ไขลง Database (Update) -----
          } else if (modalMode === 'confirmSaveEdit') {
              const updatedData = { 
                  ...formData, 
                  ...(activeMainTab === 'admin' && formData.email ? { email: formData.email.toLowerCase() } : {}),
                  lastModifiedBy: 'System', 
                  lastModifiedDate: getDateTime() 
              };
              
              const dataToUpdate = { ...updatedData };
              delete dataToUpdate.id; // ห้ามอัปเดตทับคอลัมน์ ID
              
              if (targetCollection) {
                  await updateDoc(doc(db, targetCollection, formData.id.toString()), dataToUpdate);
              }
              setData(prev => prev.map(item => item.id === formData.id ? updatedData : item));
              
              setModalMode(null);
              setSelectedItem(null);
              setFormData({});
          }
      } catch (error) {
          console.error("Action Error:", error);
          alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล: " + error.message);
      }
  };

  const handleCreateClick = () => {
    // Determine default form data
    if (activeMainTab === 'admin') {
        setFormData({ email: '', tier: 'Level 3', note: '' });
    } else if (activeMainTab === 'masterData') {
        // ค้นหาโค้ดส่วนนี้ในฟังก์ชัน handleCreateClick
        if (activeSubTab === 'boxStyle') {
            setFormData({ 
                codeName: '', 
                globalName: '', 
                baseType: 'RSC', // 1. ค่าเริ่มต้นเป็นกล่องฝาชน
                formula: '(2*W + 2*D + G + 4*M) * (H + D + 2*M)', // สูตรของกล่องฝาชน
                note: '', 
                imageUrl: '' 
            });
        } else if (activeSubTab === 'paper') {
            setFormData({ codeName: '', globalName: '', flute: '', wallType: 'Single Wall', materialCode: '', widths: '', price: '', moq: '', supplier: '', note: '' });
        } else if (activeSubTab === 'printBlock') {
            setFormData({ codeName: '', globalName: '', material: 'บล็อคแกะ (Rubber)', maxWidth: '', maxLength: '', price: '', moq: '', supplier: '', note: '' });
        } else if (activeSubTab === 'printColor') {
            setFormData({ codeName: '', globalName: '', clmvCode: '#000000', price: '', moq: '', supplier: '', note: '' });
        } else if (activeSubTab === 'dieCut') {
            setFormData({ codeName: '', globalName: '', maxWidth: '', maxLength: '', price: '', moq: '', supplier: '', note: '' });
        } else if (activeSubTab === 'customer') {
             setFormData({ name: '', company: '', taxId: '', addressShip: '', addressBill: '', mobile1: '', mobile2: '', industry: '', note: '' });
        }
    }
    setModalMode('create');
  };
  
  const handleCreateCustomerFromQuotation = () => {
      setFormData({ name: '', company: '', taxId: '', addressShip: '', addressBill: '', mobile1: '', mobile2: '', industry: '', note: '' });
      setModalMode('createCustomerFromQuot');
  }

  const handleSaveForm = () => {
      // Basic Validation
      if (activeMainTab === 'admin') {
          if (!formData.email) { alert("กรุณาระบุ Email"); return; }
      } else if (activeSubTab === 'customer' || modalMode === 'createCustomerFromQuot') {
          if (!formData.name) { alert("กรุณาระบุชื่อเรียก (Required)"); return; }
      } else {
          // Default validation for other master data
          if (activeMainTab === 'masterData' && !formData.codeName) { alert("กรุณาระบุชื่อรหัส (Required)"); return; }
      }
      
      if (modalMode === 'createCustomerFromQuot') {
           setModalMode('confirmSaveCustomerFromQuot');
      } else {
           setModalMode(modalMode === 'create' ? 'confirmSaveCreate' : 'confirmSaveEdit');
      }
  };
// --- ลอจิกจัดการข้อมูลบริษัท (App Settings) ---
// --- App Settings Handlers ---
  const handleUploadSignature = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      setIsUploadingSig(true);
      try {
          const storageRef = ref(storage, `signatures/sig_${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          setCompanyData(prev => ({ ...prev, signatureUrl: url }));
      } catch (error) { alert("อัปโหลดลายเซ็นไม่สำเร็จ"); }
      finally { setIsUploadingSig(false); }
  };

  // --- เพิ่มฟังก์ชันอัปโหลดโลโก้ ---
  const handleUploadLogo = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      setIsUploadingLogo(true);
      try {
          const storageRef = ref(storage, `logos/logo_${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          setCompanyData(prev => ({ ...prev, logoUrl: url }));
      } catch (error) { alert("อัปโหลดโลโก้ไม่สำเร็จ"); }
      finally { setIsUploadingLogo(false); }
  };

  const handleSaveCompanyData = async () => {
      try {
          const newLogs = [];
          const fieldsToTrack = [
              { key: 'nameTH', label: 'ชื่อบริษัท (TH)' }, { key: 'nameEN', label: 'ชื่อบริษัท (EN)' },
              { key: 'addressTH', label: 'ที่อยู่ (TH)' }, { key: 'addressEN', label: 'ที่อยู่ (EN)' },
              { key: 'taxId', label: 'เลขประจำตัวผู้เสียภาษี' }, { key: 'phone', label: 'เบอร์โทรศัพท์' },
              { key: 'approverTH', label: 'ผู้อนุมัติ (TH)' }, { key: 'approverEN', label: 'ผู้อนุมัติ (EN)' },
              { key: 'signatureUrl', label: 'รูปลายเซ็น' }, 
              { key: 'logoUrl', label: 'โลโก้บริษัท' } // <--- เพิ่มโลโก้เข้า Log
          ];

          fieldsToTrack.forEach(field => {
              const oldVal = originalCompanyData[field.key] || '';
              const newVal = companyData[field.key] || '';
              if (oldVal !== newVal) newLogs.push({ fieldName: field.label, oldValue: oldVal || '-', newValue: newVal || '-', modifiedBy: userEmail || 'Admin', modifiedAt: getDateTime() });
          });

          const updatedLogs = newLogs.length > 0 ? [...newLogs, ...(originalCompanyData.auditLogs || [])] : (originalCompanyData.auditLogs || []);
          const finalDataToSave = { 
              nameTH: companyData.nameTH || '', nameEN: companyData.nameEN || '', addressTH: companyData.addressTH || '', addressEN: companyData.addressEN || '',
              taxId: companyData.taxId || '', phone: companyData.phone || '', approverTH: companyData.approverTH || '', approverEN: companyData.approverEN || '',
              signatureUrl: companyData.signatureUrl || '', 
              logoUrl: companyData.logoUrl || '', // <--- เซฟโลโก้ลงฐานข้อมูล
              auditLogs: updatedLogs 
          };
          await setDoc(doc(db, "appSettings", "companyProfile"), finalDataToSave, { merge: true });
          setOriginalCompanyData(finalDataToSave); setCompanyData(finalDataToSave); setIsEditingCompany(false);
          alert("บันทึกข้อมูลบริษัทและเก็บประวัติการแก้ไขเรียบร้อยแล้ว");
      } catch (error) { alert("บันทึกข้อมูลไม่สำเร็จ: " + error.message); }
  };
  // --- Render Helpers ---

  const renderMainTabs = () => {
      const tabs = [
          { id: 'quotation', label: '1. ใบเสนอราคา', icon: FileInput },
          { id: 'masterData', label: '2. Master Data', icon: Database },
          { id: 'appSetting', label: '3. App Setting', icon: Settings },
      ];
      
      // เงื่อนไข: ถ้าเป็น Level 1 หรือ Level 2 ถึงจะโชว์แท็บ Admin (Level 3 จะมองไม่เห็น)
      if (userRole === 'Level 1' || userRole === 'Level 2') {
          tabs.push({ id: 'admin', label: '4. Admin', icon: Users });
      }

      return (
        <div className="w-full overflow-x-auto border-b border-gray-300 bg-white mb-4">
            <div className="flex min-w-max">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveMainTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 font-semibold text-sm md:text-base transition-colors whitespace-nowrap
                            ${activeMainTab === tab.id 
                                ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
      );
  };

  const renderSubTabs = () => {
    if (activeMainTab !== 'masterData') return null;

    const tabs = [
      { id: 'customer', label: 'ข้อมูลลูกค้า', icon: Briefcase }, 
      { id: 'boxStyle', label: 'รูปแบบกล่อง', icon: Box },
      { id: 'paper', label: 'ประเภทกระดาษ', icon: FileText },
      { id: 'printBlock', label: 'บล๊อคพิมพ์', icon: Grid },
      { id: 'printColor', label: 'สีพิมพ์', icon: Palette },
      { id: 'dieCut', label: 'แบบใบมีด', icon: Scissors },
    ];

    return (
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 mb-6 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors whitespace-nowrap border-b-2
              ${activeSubTab === tab.id 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderUnitToggle = () => (
      <button 
        onClick={() => setCurrentUnit(currentUnit === 'cm' ? 'inch' : 'cm')}
        className="fixed bottom-6 right-6 z-50 bg-blue-800 text-white rounded-full shadow-lg p-3 flex items-center gap-2 hover:bg-blue-900 transition-all hover:scale-105 active:scale-95"
      >
        <ArrowLeftRight size={20} />
        <span className="font-bold text-sm">
            {currentUnit === 'cm' ? 'Unit: CM' : 'Unit: INCH'}
        </span>
      </button>
  );

  // --- Specific Table Renders ---
  
  const renderCustomerTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">ข้อมูลลูกค้า (Customer Info)</h2>
          <p className="text-sm text-gray-500">จัดการรายชื่อลูกค้าและข้อมูลการจัดส่ง</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleCreateClick}>เพิ่มลูกค้าใหม่</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 border-b">ชื่อเรียก</th>
              <th className="p-4 border-b">บริษัท/บุคคล</th>
              <th className="p-4 border-b">กลุ่มลูกค้า</th>
              <th className="p-4 border-b">เบอร์ติดต่อ</th>
              <th className="p-4 border-b">ที่อยู่จัดส่ง</th>
              <th className="p-4 border-b text-center border-l">Audit Log</th>
              <th className="p-4 border-b text-center bg-gray-100 border-l" style={{position: 'sticky', right: 0}}>จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {customers.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-medium text-gray-900">
                      {item.name}
                  </td>
                  <td className="p-4 text-gray-700">
                      <div className="font-semibold">{item.company}</div>
                      <div className="text-xs text-gray-500">Tax ID: {item.taxId || '-'}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                      <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs border border-purple-100">{item.industry || 'ไม่ระบุ'}</span>
                  </td>
                  <td className="p-4 text-gray-600">
                      <div className="flex flex-col text-xs">
                          <span>M1: {item.mobile1 || '-'}</span>
                          <span>M2: {item.mobile2 || '-'}</span>
                      </div>
                  </td>
                  <td className="p-4 text-gray-500 max-w-xs truncate" title={item.addressShip}>{item.addressShip || '-'}</td>
                  <td className="p-4 text-center text-xs text-gray-400 border-l">
                        <div title={`Created: ${item.createdBy} (${item.createdDate})`}>C: {item.createdDate?.split(' ')[0]}</div>
                        <div title={`Modified: ${item.lastModifiedBy} (${item.lastModifiedDate})`}>M: {item.lastModifiedDate?.split(' ')[0]}</div>
                  </td>
                  <td className="p-4 bg-white border-l" style={{position: 'sticky', right: 0}}>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" icon={Copy} className="!p-2 text-xs" onClick={() => handleActionClick('copy', item)} title="Copy" />
                      <Button variant="secondary" icon={Edit} className="!p-2 text-xs" onClick={() => handleActionClick('edit', item)} title="Edit" />
                      <Button variant="danger" icon={Trash2} className="!p-2 text-xs" onClick={() => handleActionClick('delete', item)} title="Delete" />
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBoxStyleTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">ข้อมูลรูปแบบกล่อง (Box Styles)</h2>
          <p className="text-sm text-gray-500">จัดการรูปแบบกล่องและสูตรคำนวณพื้นที่</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleCreateClick}>เพิ่มรายการ</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 border-b">ชื่อรหัส</th>
              <th className="p-4 border-b">ชื่อแบบ Global</th>
              <th className="p-4 border-b">สูตรพื้นที่</th>
              <th className="p-4 border-b">Note</th>
              <th className="p-4 border-b text-center border-l">Audit Log</th>
              <th className="p-4 border-b text-center bg-gray-100 border-l" style={{position: 'sticky', right: 0}}>จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {boxStyles.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{item.codeName}</td>
                  <td className="p-4 text-gray-600 max-w-xs truncate">{item.globalName}</td>
                  <td className="p-4"><span className="font-mono text-xs bg-gray-50 rounded px-2 py-1 border border-gray-100">{item.formula}</span></td>
                  <td className="p-4 text-gray-500 max-w-xs truncate">{item.note || '-'}</td>
                  <td className="p-4 text-center text-xs text-gray-400 border-l">
                        <div title={`Created: ${item.createdBy} (${item.createdDate})`}>C: {item.createdDate?.split(' ')[0]}</div>
                        <div title={`Modified: ${item.lastModifiedBy} (${item.lastModifiedDate})`}>M: {item.lastModifiedDate?.split(' ')[0]}</div>
                  </td>
                  <td className="p-4 bg-white border-l" style={{position: 'sticky', right: 0}}>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" icon={Eye} className="!p-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200" onClick={() => {setSelectedItem(item); setModalMode('preview');}} title="Preview" />
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <Button variant="secondary" icon={Copy} className="!p-2 text-xs" onClick={() => handleActionClick('copy', item)} title="Copy" />
                      <Button variant="secondary" icon={Edit} className="!p-2 text-xs" onClick={() => handleActionClick('edit', item)} title="Edit" />
                      <Button variant="danger" icon={Trash2} className="!p-2 text-xs" onClick={() => handleActionClick('delete', item)} title="Delete" />
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPaperTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">ข้อมูลประเภทกระดาษ (Paper Types)</h2>
          <p className="text-sm text-gray-500">จัดการสเปคกระดาษลูกฟูก ราคา และ Supplier</p>
        </div>
        {/* 🌟 จุดที่ 2: เปลี่ยนเป็นปุ่ม 2 อัน */}
        <div className="flex gap-2">
            <Button variant="outline" icon={FilePlus} onClick={() => { setBulkImportData({ rawText: '', supplier: '', note: '', flute: 'B', wallType: 'Single Wall', widths: '', suffix: '' }); setModalMode('bulkImportPaper'); }}>นำเข้าหลายรายการ</Button>
            <Button variant="primary" icon={Plus} onClick={handleCreateClick}>เพิ่มรายการ</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 border-b">ชื่อรหัส</th>
              <th className="p-4 border-b">สเปค (Spec)</th>
              <th className="p-4 border-b text-center">Color</th>
              <th className="p-4 border-b min-w-[150px]">หน้ากว้าง ({currentUnit})</th>
              <th className="p-4 border-b text-right">ราคา/หน่วย</th>
              <th className="p-4 border-b text-right">MOQ</th>
              <th className="p-4 border-b">Supplier</th>
              <th className="p-4 border-b">Note</th>
              <th className="p-4 border-b text-center border-l">Audit Log</th>
              <th className="p-4 border-b text-center bg-gray-100 border-l" style={{position: 'sticky', right: 0}}>จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {paperTypes.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-medium text-gray-900">
                      {item.codeName}
                      {/* 🌟 2. เพิ่มป้ายบอกสถานะตรงนี้ */}
                      {item.isActive === false ? (
                          <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded ml-2 border border-red-200">ยกเลิก (Inactive)</span>
                      ) : (
                          <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded ml-2 border border-green-200">ใช้งานอยู่</span>
                      )}
                      <div className="text-xs text-gray-400 font-normal mt-1">{item.globalName}</div>
                  </td>
                  <td className="p-4">
                      <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-700">{item.flute}-Flute</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border w-fit ${item.wallType === 'Double Wall' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                              {item.wallType}
                          </span>
                      </div>
                  </td>
                  <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                          <div 
                              className="w-6 h-6 rounded-full shadow-sm border border-gray-200" 
                              style={{backgroundColor: getColorFromCode(item.materialCode)}}
                              title={`Color: ${item.materialCode}`}
                          />
                          <span className="text-[10px] font-bold text-gray-500">{item.materialCode}</span>
                      </div>
                  </td>
                  <td className="p-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                          {formatDimension(item.widths, currentUnit).split(',').map((w, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">{w.trim()}</span>
                          ))}
                      </div>
                  </td>
                  <td className="p-4 text-right font-medium text-blue-600">{item.price ? parseFloat(item.price).toFixed(2) : '-'}</td>
                  <td className="p-4 text-right text-gray-500">{item.moq}</td>
                  <td className="p-4 text-gray-700">
                      <div className="flex items-center gap-1"><Truck size={14} className="text-gray-400"/> {item.supplier}</div>
                  </td>
                  <td className="p-4 text-gray-400 max-w-[150px] truncate" title={item.note}>{item.note || '-'}</td>
                  <td className="p-4 text-center text-xs text-gray-400 border-l">
                      <div title={`Created: ${item.createdBy} (${item.createdDate})`}>C: {item.createdDate?.split(' ')[0]}</div>
                      <div title={`Modified: ${item.lastModifiedBy} (${item.lastModifiedDate})`}>M: {item.lastModifiedDate?.split(' ')[0]}</div>
                  </td>
                  <td className="p-4 bg-white border-l" style={{position: 'sticky', right: 0}}>
                      <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" icon={Copy} className="!p-2 text-xs" onClick={() => handleActionClick('copy', item)} title="Copy" />
                      <Button variant="secondary" icon={Edit} className="!p-2 text-xs" onClick={() => handleActionClick('edit', item)} title="Edit" />
                      <Button variant="danger" icon={Trash2} className="!p-2 text-xs" onClick={() => handleActionClick('delete', item)} title="Delete" />
                      </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPrintBlockTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">ข้อมูลบล๊อคพิมพ์ (Printing Blocks)</h2>
          <p className="text-sm text-gray-500">จัดการข้อมูลแม่พิมพ์ (บล็อคแกะ/หล่อ) ราคา และขนาด</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleCreateClick}>เพิ่มรายการ</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 border-b">ชื่อรหัส</th>
              <th className="p-4 border-b">วัสดุ (Material)</th>
              <th className="p-4 border-b">ขนาดกว้าง (นิ้ว)</th>
              <th className="p-4 border-b">ขนาดยาว (นิ้ว)</th>
              <th className="p-4 border-b text-right">ราคา/ตร.นิ้ว</th>
              <th className="p-4 border-b text-right">MOQ</th>
              <th className="p-4 border-b">Supplier</th>
              <th className="p-4 border-b">Note</th>
              <th className="p-4 border-b text-center border-l">Audit Log</th>
              <th className="p-4 border-b text-center bg-gray-100 border-l" style={{position: 'sticky', right: 0}}>จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {printBlocks.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-medium text-gray-900">
                      {item.codeName}
                      <div className="text-xs text-gray-400 font-normal">{item.globalName}</div>
                  </td>
                  <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded border ${item.material?.includes('Rubber') ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}`}>
                          {item.material}
                      </span>
                  </td>
                  <td className="p-4 text-gray-700">Max {item.maxWidth || '-'}</td>
                  <td className="p-4 text-gray-700">Max {item.maxLength || '-'}</td>
                  <td className="p-4 text-right font-medium text-blue-600">{item.price ? parseFloat(item.price).toFixed(2) : '-'}</td>
                  <td className="p-4 text-right text-gray-500">{item.moq}</td>
                  <td className="p-4 text-gray-700">
                      <div className="flex items-center gap-1"><Truck size={14} className="text-gray-400"/> {item.supplier}</div>
                  </td>
                  <td className="p-4 text-gray-400 max-w-[150px] truncate" title={item.note}>{item.note || '-'}</td>
                  <td className="p-4 text-center text-xs text-gray-400 border-l">
                      <div title={`Created: ${item.createdBy} (${item.createdDate})`}>C: {item.createdDate?.split(' ')[0]}</div>
                      <div title={`Modified: ${item.lastModifiedBy} (${item.lastModifiedDate})`}>M: {item.lastModifiedDate?.split(' ')[0]}</div>
                  </td>
                  <td className="p-4 bg-white border-l" style={{position: 'sticky', right: 0}}>
                      <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" icon={Copy} className="!p-2 text-xs" onClick={() => handleActionClick('copy', item)} title="Copy" />
                      <Button variant="secondary" icon={Edit} className="!p-2 text-xs" onClick={() => handleActionClick('edit', item)} title="Edit" />
                      <Button variant="danger" icon={Trash2} className="!p-2 text-xs" onClick={() => handleActionClick('delete', item)} title="Delete" />
                      </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const renderPrintColorTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">ข้อมูลสีพิมพ์ (Printing Colors)</h2>
          <p className="text-sm text-gray-500">จัดการข้อมูลหมึกพิมพ์และรหัสสี (CMYK/Pantone)</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleCreateClick}>เพิ่มรายการ</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 border-b">ชื่อรหัส</th>
              <th className="p-4 border-b">แสดงสี (Display)</th>
              <th className="p-4 border-b">C,L,M, V Code</th>
              <th className="p-4 border-b text-right">ราคา/หน่วย</th>
              <th className="p-4 border-b text-right">MOQ (ลิตร)</th>
              <th className="p-4 border-b">Supplier</th>
              <th className="p-4 border-b">Note</th>
              <th className="p-4 border-b text-center border-l">Audit Log</th>
              <th className="p-4 border-b text-center bg-gray-100 border-l" style={{position: 'sticky', right: 0}}>จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {printColors.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-medium text-gray-900">
                      {item.codeName}
                      <div className="text-xs text-gray-400 font-normal">{item.globalName}</div>
                  </td>
                  <td className="p-4">
                      <div className="flex items-center gap-3">
                          <div 
                              className="w-10 h-10 rounded-lg shadow-sm border border-gray-200" 
                              style={{backgroundColor: item.clmvCode}}
                          />
                      </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600">{item.clmvCode}</td>
                  <td className="p-4 text-right font-medium text-blue-600">{item.price ? parseFloat(item.price).toFixed(2) : '-'}</td>
                  <td className="p-4 text-right text-gray-500">{item.moq} <span className="text-xs text-gray-400">L</span></td>
                  <td className="p-4 text-gray-700">
                      <div className="flex items-center gap-1"><Truck size={14} className="text-gray-400"/> {item.supplier}</div>
                  </td>
                  <td className="p-4 text-gray-400 max-w-[150px] truncate" title={item.note}>{item.note || '-'}</td>
                  <td className="p-4 text-center text-xs text-gray-400 border-l">
                      <div title={`Created: ${item.createdBy} (${item.createdDate})`}>C: {item.createdDate?.split(' ')[0]}</div>
                      <div title={`Modified: ${item.lastModifiedBy} (${item.lastModifiedDate})`}>M: {item.lastModifiedDate?.split(' ')[0]}</div>
                  </td>
                  <td className="p-4 bg-white border-l" style={{position: 'sticky', right: 0}}>
                      <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" icon={Copy} className="!p-2 text-xs" onClick={() => handleActionClick('copy', item)} title="Copy" />
                      <Button variant="secondary" icon={Edit} className="!p-2 text-xs" onClick={() => handleActionClick('edit', item)} title="Edit" />
                      <Button variant="danger" icon={Trash2} className="!p-2 text-xs" onClick={() => handleActionClick('delete', item)} title="Delete" />
                      </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDieCutTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">ข้อมูลแบบใบมีด (Die Cut Molds)</h2>
          <p className="text-sm text-gray-500">จัดการข้อมูลแม่พิมพ์ใบมีดไดคัท (Rotary/Flatbed)</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleCreateClick}>เพิ่มรายการ</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 border-b">ชื่อรหัส</th>
              <th className="p-4 border-b">ชื่อแบบ Global</th>
                <th className="p-4 border-b">ขนาดกว้าง (นิ้ว)</th>
              <th className="p-4 border-b">ขนาดยาว (นิ้ว)</th>
              <th className="p-4 border-b text-right">ราคา/ตร.นิ้ว</th>
              <th className="p-4 border-b text-right">MOQ</th>
              <th className="p-4 border-b">Supplier</th>
              <th className="p-4 border-b">Note</th>
              <th className="p-4 border-b text-center border-l">Audit Log</th>
              <th className="p-4 border-b text-center bg-gray-100 border-l" style={{position: 'sticky', right: 0}}>จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {dieCutMolds.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{item.codeName}</td>
                  <td className="p-4 text-gray-600 max-w-xs truncate">{item.globalName}</td>
                  <td className="p-4 text-gray-700">Max {item.maxWidth || '-'}</td>
                  <td className="p-4 text-gray-700">Max {item.maxLength || '-'}</td>
                  <td className="p-4 text-right font-medium text-blue-600">{item.price ? parseFloat(item.price).toFixed(2) : '-'}</td>
                  <td className="p-4 text-right text-gray-500">{item.moq}</td>
                  <td className="p-4 text-gray-700">
                      <div className="flex items-center gap-1"><Truck size={14} className="text-gray-400"/> {item.supplier}</div>
                  </td>
                  <td className="p-4 text-gray-400 max-w-[150px] truncate" title={item.note}>{item.note || '-'}</td>
                  <td className="p-4 text-center text-xs text-gray-400 border-l">
                      <div title={`Created: ${item.createdBy} (${item.createdDate})`}>C: {item.createdDate?.split(' ')[0]}</div>
                      <div title={`Modified: ${item.lastModifiedBy} (${item.lastModifiedDate})`}>M: {item.lastModifiedDate?.split(' ')[0]}</div>
                  </td>
                  <td className="p-4 bg-white border-l" style={{position: 'sticky', right: 0}}>
                      <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" icon={Copy} className="!p-2 text-xs" onClick={() => handleActionClick('copy', item)} title="Copy" />
                      <Button variant="secondary" icon={Edit} className="!p-2 text-xs" onClick={() => handleActionClick('edit', item)} title="Edit" />
                      <Button variant="danger" icon={Trash2} className="!p-2 text-xs" onClick={() => handleActionClick('delete', item)} title="Delete" />
                      </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const renderAdminTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">ข้อมูลสิทธิ์ Admin (User Management)</h2>
          <p className="text-sm text-gray-500">จัดการรายชื่อผู้ใช้งานและกำหนดระดับสิทธิ์การเข้าถึง</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleCreateClick}>เพิ่มผู้ใช้งาน</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 border-b">Email Account</th>
              <th className="p-4 border-b">Admin Tier</th>
              <th className="p-4 border-b">Note</th>
              <th className="p-4 border-b text-center border-l">Audit Log</th>
              <th className="p-4 border-b text-center bg-gray-100 border-l" style={{position: 'sticky', right: 0}}>จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {admins.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <User size={16} />
                      </div>
                      {item.email}
                  </td>
                  <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold
                          ${item.tier === 'Level 1' ? 'bg-red-50 text-red-700 border-red-200' : 
                            item.tier === 'Level 2' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                            'bg-green-50 text-green-700 border-green-200'}`}>
                          {item.tier}
                      </span>
                  </td>
                  <td className="p-4 text-gray-500 max-w-xs truncate">{item.note || '-'}</td>
                  <td className="p-4 text-center text-xs text-gray-400 border-l">
                      <div title={`Created: ${item.createdBy} (${item.createdDate})`}>C: {item.createdDate?.split(' ')[0]}</div>
                      <div title={`Modified: ${item.lastModifiedBy} (${item.lastModifiedDate})`}>M: {item.lastModifiedDate?.split(' ')[0]}</div>
                  </td>
                  <td className="p-4 bg-white border-l" style={{position: 'sticky', right: 0}}>
                      <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" icon={Copy} className="!p-2 text-xs" onClick={() => handleActionClick('copy', item)} title="Copy" />
                      <Button variant="secondary" icon={Edit} className="!p-2 text-xs" onClick={() => handleActionClick('edit', item)} title="Edit" />
                      <Button variant="danger" icon={Trash2} className="!p-2 text-xs" onClick={() => handleActionClick('delete', item)} title="Delete" />
                      </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

// --- ฟังก์ชันบันทึกใบเสนอราคาลง Database ---
const handleSaveQuotation = async () => {
      try {
          // 🌟🌟🌟 ดักสถานะตรงนี้: ห้ามเซฟทับถ้าสั่งผลิตหรือปิดรายการแล้ว 🌟🌟🌟
          if (currentQuot.status && currentQuot.status.startsWith('3')) {
              alert(`⚠️ ไม่อนุญาตให้บันทึกทับเอกสารนี้ เนื่องจากสถานะคือ "${currentQuot.status}"\n\nหากต้องการเปลี่ยนแปลงข้อมูล หรือทำราคาใหม่ให้ลูกค้า กรุณาสร้างใบเสนอราคาใหม่แทนครับ`);
              return; // หยุดการทำงานทันที (ไม่เซฟลง Database)
          }

          if (!currentQuot.customerId) {
              alert("กรุณาเลือกลูกค้าให้ครบถ้วนก่อนบันทึก");
              return;
          }
          
          // เช็คว่ากล่องทุกใบถูกเลือก รูปแบบ และ กระดาษ หรือยัง
          const hasInvalidItem = currentQuot.items.some(item => !item.boxStyleId || !item.paperTypeId);
          if (hasInvalidItem) {
              alert("กรุณาเลือก รูปแบบกล่อง และ เกรดกระดาษ ให้ครบทุกรายการก่อนบันทึก");
              return;
          }

          const now = new Date();
          const currentDateStr = getDateTime();

          // 1. เช็คว่าเป็นสร้างใหม่ หรือ แก้ไข
          const isEditing = !!currentQuot.id; // ถ้ามี ID จริงๆ แปลว่า Edit
          const currentRev = currentQuot.revision ? parseInt(currentQuot.revision) : 0;
          const nextRevision = isEditing ? currentRev + 1 : 0; // แก้ไขให้บวก 1

          // 2. จัดการวันที่เพื่อสร้างเลขที่เอกสาร (ยึดตามวันเวลาที่สร้างครั้งแรกเสมอ)
          const baseDateStr = currentQuot.createdDate ? currentQuot.createdDate : currentDateStr;
          
          // แยกวันที่และเวลาออกจากรูปแบบ "YYYY-MM-DD HH:mm" แบบตรงๆ 
          const [datePart, timePart] = baseDateStr.split(' ');
          const [yyyy, mm, dd] = datePart.split('-');
          const [hh, min] = timePart.split(':');
          
          const yy = yyyy.slice(-2); // ดึงปีมาแค่ 2 หลักท้าย
          const revStr = String(nextRevision).padStart(2, '0'); // แปลง Revision ให้เป็น 2 หลัก
          
          // ประกอบร่างใหม่เป็น Format: AIPQ_DDMMYYhhmm_Sxx
          const newQuotNo = `AIPQ_${dd}${mm}${yy}${hh}${min}_S${revStr}`;

          // 3. เตรียมข้อมูลเซฟ 
          const dataToSave = { ...currentQuot };
          delete dataToSave.id; // ลบ id ออก เพื่อไม่ให้เซฟค่า null ลง Database
          
          dataToSave.quotationNo = newQuotNo;
          dataToSave.revision = nextRevision;
          dataToSave.lastModifiedBy = userEmail;
          dataToSave.lastModifiedDate = currentDateStr;

          if (isEditing) {
              // Update 
              await updateDoc(doc(db, "quotations", currentQuot.id), dataToSave);
              alert(`✅ อัปเดตข้อมูลสำเร็จ! (เลขที่อ้างอิง: ${newQuotNo})`);
          } else {
              // Create
              dataToSave.createdBy = userEmail;
              dataToSave.createdDate = currentDateStr;
              dataToSave.status = '0.แบบร่าง';
              await addDoc(collection(db, "quotations"), dataToSave);
              alert(`✅ บันทึกใบเสนอราคาใหม่สำเร็จ! (เลขที่อ้างอิง: ${newQuotNo})`);
          }
          
          // โหลดข้อมูลอัปเดตตารางใหม่ 
          const qSnap = await getDocs(collection(db, "quotations"));
          const quots = qSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })); 
          quots.sort((a, b) => new Date(b.lastModifiedDate || b.createdDate) < new Date(a.lastModifiedDate || a.createdDate) ? 1 : -1);
          setQuotationList(quots);
          
          setQuotationView('list');
      } catch (error) {
          console.error("Save Quotation Error:", error);
          alert("บันทึกไม่สำเร็จ: " + error.message);
      }
  };


// 🌟 ฟังก์ชันคัดลอกใบเสนอราคาเดิม สร้างเป็นใบใหม่ 🌟
  const handleDuplicateQuotation = (sourceQuot) => {
      if (!window.confirm("คุณต้องการคัดลอกข้อมูลนี้ เพื่อสร้างเป็น 'ใบเสนอราคาใหม่' ใช่หรือไม่?\n\n(ระบบจะใช้ราคากระดาษปัจจุบันจาก Master Data แทนราคาเดิม)")) {
          return;
      }

      // 1. คัดลอกรายการกล่องทั้งหมด และ "ล้างค่าราคากระดาษเดิม" ทิ้ง
      const copiedItems = sourceQuot.items.map(item => {
          const newItem = { ...item };
          
          // 🛑 ลบ Snapshot ราคาเก่าทิ้ง เพื่อบังคับให้ระบบไปดึงราคาล่าสุดจาก Master Data
          delete newItem.paperPriceSnapshot; 
          
          // เคลียร์ ID ของกล่อง (ถ้ามี) เผื่อใช้สำหรับอ้างอิงใหม่
          newItem.id = Date.now() + Math.random(); 
          return newItem;
      });

      // 2. สร้าง Object ใบเสนอราคาใหม่
      const newQuotData = {
          ...sourceQuot,
          id: null,               // เคลียร์ ID เพื่อให้ระบบรู้ว่าเป็นเอกสารใหม่
          quotationNo: '',        // รอ Gen เลขใหม่ตอนกดบันทึก
          revision: 0,            // เริ่มนับ Rev ใหม่
          status: '0.แบบร่าง',    // กลับไปเป็นสถานะแบบร่าง
          items: copiedItems,     // ใส่รายการกล่องที่ล้างราคาแล้ว
          createdDate: null       // เคลียร์วันที่สร้าง เพื่อให้ใช้วันปัจจุบันตอนเซฟ
      };

      // 3. ยัดข้อมูลใหม่ใส่ฟอร์ม และเปิดหน้าจอ
      setCurrentQuot(newQuotData);
      setCollapsedItems({}); // เปิดให้เห็นรายละเอียดทุกกล่อง
      setQuotationView('create');

      // 🌟🌟🌟 เพิ่ม Prompt (Alert) แจ้งเตือน User ตรงนี้ 🌟🌟🌟
      setTimeout(() => {
          alert("✅ ระบบได้คัดลอกใบเสนอราคาแล้ว\n\n⚠️ กรุณาตรวจสอบข้อมูล และ อัปเดตราคากระดาษปัจจุบันอีกครั้งก่อนกดบันทึก");
      }, 100); 
      // ใส่ setTimeout ไว้ 100ms เพื่อให้หน้าจอสลับไปฟอร์มใหม่ให้เสร็จก่อน แล้วค่อยเด้งข้อความขึ้นมาเตือนครับ
  };
  
  // NEW: Quotation Screen
 const renderQuotationScreen = () => {
    if (quotationView === 'list') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeLast30DaysCount = quotationList.filter(q => {
            const isNotClosed = !q.status?.includes('3.2'); 
            if (!q.createdDate) return false;
            const qDate = new Date(q.createdDate.replace(' ', 'T')); 
            return isNotClosed && (qDate >= thirtyDaysAgo);
        }).length;

        const pendingReviewCount = quotationList.filter(q => q.status?.includes('1.รอการตรวจสอบ')).length;

        // ฟังก์ชันจำลองคำนวณราคาเฉลี่ยต่อกล่องสำหรับโชว์หน้าตาราง
        // ฟังก์ชันคำนวณแยกราคากล่องแต่ละรายการ เพื่อโชว์ในตาราง
        // ฟังก์ชันคำนวณแยกราคากล่องแต่ละรายการ เพื่อโชว์ในตาราง (อัปเดตกำไรแยกส่วน)
// ฟังก์ชันคำนวณแยกราคากล่องแต่ละรายการ เพื่อโชว์ในตาราง (แก้ให้ราคาตรงกับ PDF)
const getItemSummaryList = (quot) => {
    if (!quot.items || quot.items.length === 0) return [];
    const isPerBox = quot.displayMode !== 'detailed'; 

    const marginBox = (parseFloat(quot.profitMarginBox) || 0) / 100;
    const marginBlock = (parseFloat(quot.profitMarginBlock) || 0) / 100;
    const marginDieCut = (parseFloat(quot.profitMarginDieCut) || 0) / 100;

    let sumSellingPrice = 0;
    const itemsRaw = [];

    quot.items.forEach(item => {
        const boxStyle = boxStyles.find(b => b.id?.toString() === item.boxStyleId?.toString());
        const paper = paperTypes.find(p => p.id?.toString() === item.paperTypeId?.toString());
        let areaSqCm = 0;
        if (boxStyle && boxStyle.formula) {
            try {
                let safeFormula = boxStyle.formula.replace(/(\d)([WDHGM])/gi, '$1*$2');
                const calcArea = new Function('W', 'D', 'H', 'G', 'M', `return ${safeFormula};`);
                areaSqCm = calcArea(parseFloat(item.dimW)||0, parseFloat(item.dimD)||0, parseFloat(item.dimH)||0, parseFloat(item.dimG)||0, parseFloat(item.dimM)||0);
                if (isNaN(areaSqCm) || areaSqCm < 0) areaSqCm = 0;
            } catch (e) {}
        }
        const areaSqFt = areaSqCm / 929.0304; 
        // 🌟 4. ดึงราคาจากที่ Snapshot ไว้ก่อน ถ้าไม่มีค่อยไปดึงจาก Master
        const pPrice = item.paperPriceSnapshot !== undefined ? parseFloat(item.paperPriceSnapshot) : (paper ? parseFloat(paper.price) : 0);
        
        const rawBoxCost = (areaSqFt * pPrice) + (parseFloat(item.printCostPerBox) || 0);
        const sellBoxCost = rawBoxCost * (1 + marginBox);
        const blockCost = (item.printBlocks1 || []).reduce((s, b) => s + (parseFloat(b.price) || 0), 0) + (item.printBlocks2 || []).reduce((s, b) => s + (parseFloat(b.price) || 0), 0);
        const sellBlockCost = blockCost * (1 + marginBlock);

        let dieCutCost = 0; 
        if (item.dieCutId && item.dieCutW && item.dieCutL) {
            const mold = dieCutMolds.find(d => d.id?.toString() === item.dieCutId?.toString());
            dieCutCost = (parseFloat(item.dieCutW) || 0) * (parseFloat(item.dieCutL) || 0) * (mold ? parseFloat(mold.price) : 0); 
        }
        const sellDieCutCost = dieCutCost * (1 + marginDieCut);
        const qty = parseInt(item.quantity) || 1;
        const itemSellingTotal = (sellBoxCost * qty) + sellBlockCost + sellDieCutCost;
        sumSellingPrice += itemSellingTotal;

        itemsRaw.push({
            dim: `${item.dimW || 0} x ${item.dimD || 0} x ${item.dimH || 0}`,
            qty: qty,
            sellBoxCost: sellBoxCost,
            itemSellingTotal: itemSellingTotal
        });
    });

    const shipCost = quot.shippingType === 'delivery' ? (parseFloat(quot.shippingCost) || 0) : 0;
    const setup = parseFloat(quot.setupCost) || 0;
    const totalWithProfit = sumSellingPrice + setup + shipCost;
    const discountPercent = parseFloat(quot.discount) || 0;
    const totalAfterDiscount = totalWithProfit - (totalWithProfit * (discountPercent / 100));
    const factor = totalWithProfit > 0 ? (totalAfterDiscount / totalWithProfit) : 1;

    return itemsRaw.map(item => {
        let unitPrice = 0;
        if (isPerBox) {
            // โหมดรวบยอด: คำนวณราคาที่กระจายค่าทั้งหมดรวมไว้แล้ว
            const ratio = sumSellingPrice > 0 ? (item.itemSellingTotal / sumSellingPrice) : 0;
            const itemOverhead = (setup + shipCost) * ratio;
            const perBoxFinalTotal = (item.itemSellingTotal + itemOverhead) * factor;
            unitPrice = item.qty > 0 ? perBoxFinalTotal / item.qty : 0;
        } else {
            // โหมดแจกแจง: แสดงเฉพาะค่ากล่องเปล่าๆ 
            const finalBoxTotal = (item.sellBoxCost * item.qty) * factor;
            unitPrice = item.qty > 0 ? finalBoxTotal / item.qty : 0;
        }
        return { dim: item.dim, qty: item.qty, unitPrice };
    });
};

        return (
            <div className="space-y-6">
                 <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                         <div>
                             <p className="text-sm font-semibold text-gray-500 mb-1">งานเปิดอยู่ (30 วันล่าสุด)</p>
                             <h3 className="text-2xl font-bold text-gray-800">{activeLast30DaysCount} <span className="text-lg font-normal">ใบ</span></h3>
                         </div>
                         <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><FileText size={24} /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200 flex items-center justify-between">
                         <div>
                             <p className="text-sm font-semibold text-gray-500 mb-1">รอการตรวจสอบ</p>
                             <h3 className="text-2xl font-bold text-gray-800">{pendingReviewCount} <span className="text-lg font-normal">ใบ</span></h3>
                         </div>
                         <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 shadow-sm border border-yellow-100"><AlertCircle size={24} /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group" onClick={handleCreateNewQuot}>
                         <div className="text-center">
                             <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2 shadow-md group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                             <h3 className="font-semibold text-blue-600">สร้างใบเสนอราคาใหม่</h3>
                         </div>
                    </div>
                 </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">รายการใบเสนอราคาที่บันทึกไว้</h3>
                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">ทั้งหมด {quotationList?.length || 0} รายการ</span>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                            <thead className="bg-white sticky top-0 shadow-sm z-10">
                                <tr className="text-gray-500 text-xs uppercase tracking-wider bg-gray-50">
                                    {/* 🌟 3. ย้าย จัดการ มาหน้าสุด */}
                                    <th className="p-4 border-b text-center w-32">จัดการ</th>
                                    <th className="p-4 border-b">ชื่อลูกค้า / เลขเอกสาร</th>
                                    <th className="p-4 border-b text-center whitespace-nowrap">ขนาดกล่อง (W x D x H)</th>
                                    <th className="p-4 border-b text-right whitespace-nowrap">ราคาขาย</th>
                                    <th className="p-4 border-b text-right">จำนวน</th>
                                    <th className="p-4 border-b w-40">สถานะ (Status)</th>
                                    <th className="p-4 border-b">สร้างโดย</th>
                                    <th className="p-4 border-b">แก้ไขโดย</th>
                                    <th className="p-4 border-b">สร้างเมื่อ</th>
                                    <th className="p-4 border-b">แก้ไขล่าสุด</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(!quotationList || quotationList.length === 0) ? (
                                    <tr>
                                        <td colSpan="10" className="p-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2"><FileText size={48} className="text-gray-200" /><p>ยังไม่มีข้อมูลใบเสนอราคา</p></div>
                                        </td>
                                    </tr>
                                ) : (
                                    quotationList.map((quot) => {
                                        const nameData = generateQuotName(quot);
                                        const itemSummaries = getItemSummaryList(quot);

                                        return (
                                        <tr key={quot.id} className="hover:bg-blue-50/30 transition-colors">
                                            
                                            {/* คอลัมน์ 1: จัดการ */}
                                            <td className="p-4 text-center align-top">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleDownloadPDF(quot)} className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors" title="ดาวน์โหลด PDF">📄</button>
                                                    <button onClick={() => handleEditQuotation(quot)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded transition-colors" title="แก้ไขใบเสนอราคา"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteQuotation(quot.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors" title="ลบใบเสนอราคา"><Trash2 size={16} /></button>
                                                </div>
                                            </td>

                                            {/* คอลัมน์ 2: ชื่อและเลขเอกสาร */}
                                            <td className="p-4 max-w-[250px] align-top">
                                                <div className="font-bold text-blue-800 truncate" title={nameData.line1}>{nameData.line1}</div>
                                                <div className="text-xs text-gray-500 truncate mt-0.5 font-mono" title={nameData.line2}>{nameData.line2}</div>
                                            </td>

                                            {/* คอลัมน์ 3: ขนาดกล่อง (แสดงเป็นลิสต์) */}
                                            <td className="p-4 text-center text-gray-600 text-sm whitespace-nowrap align-top">
                                                {itemSummaries.map((it, i) => (
                                                    <div key={i} className="py-1">{it.dim}</div>
                                                ))}
                                            </td>

                                            {/* คอลัมน์ 4: ราคา (แสดงเป็นลิสต์) */}
                                            <td className="p-4 text-right font-bold text-green-600 bg-green-50/30 align-top">
                                                {itemSummaries.map((it, i) => (
                                                    <div key={i} className="py-1">{it.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ฿/ใบ</div>
                                                ))}
                                            </td>

                                            {/* คอลัมน์ 5: จำนวน (แสดงเป็นลิสต์) */}
                                            <td className="p-4 text-right font-bold text-gray-700 align-top">
                                                {itemSummaries.map((it, i) => (
                                                    <div key={i} className="py-1">{it.qty.toLocaleString()} ใบ</div>
                                                ))}
                                            </td>

                                            {/* คอลัมน์อื่นๆ ที่เหลือ (ใช้ align-top ให้ข้อความชิดด้านบนเวลาตารางขยาย) */}
                                            <td className="p-4 align-top">
                                                <select 
                                                    className={`text-xs font-semibold py-1 px-2 rounded border cursor-pointer outline-none transition-colors
                                                        ${quot.status?.startsWith('0') ? 'bg-gray-100 text-gray-600 border-gray-200' : 
                                                        quot.status?.startsWith('1') ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                                                        quot.status?.startsWith('2') ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                                        quot.status?.startsWith('3.1') ? 'bg-green-100 text-green-700 border-green-200' : 
                                                        'bg-gray-800 text-white border-gray-700'
                                                        }`}
                                                    value={quot.status || "0.แบบร่าง"}
                                                    onChange={(e) => handleStatusChange(quot.id, e.target.value, quot.status)}
                                                >
                                                    {quotationStatuses.map(s => (<option key={s} value={s} className="bg-white text-gray-800">{s}</option>))}
                                                </select>
                                            </td>
                                            <td className="p-4 text-gray-600 truncate max-w-[120px] align-top" title={quot.createdBy}>{quot.createdBy || '-'}</td>
                                            <td className="p-4 text-gray-600 truncate max-w-[120px] align-top" title={quot.lastModifiedBy}>{quot.lastModifiedBy || '-'}</td>
                                            <td className="p-4 text-xs text-gray-500 align-top">{quot.createdDate ? quot.createdDate.split('.')[0].replace('T', ' ') : '-'}</td>
                                            <td className="p-4 text-xs text-gray-500 align-top">{quot.lastModifiedDate ? quot.lastModifiedDate.split('.')[0].replace('T', ' ') : '-'}</td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
   } else {
        // 🌟 1. เพิ่มตัวแปรเช็คสถานะและกำหนด Theme ของ Header
        const isLocked = currentQuot.status?.startsWith('3');
        const isEditing = !!currentQuot.id;

        let headerTheme = {
            title: "สร้างใบเสนอราคาใหม่",
            subtitle: "New Quotation Draft",
            bgClass: "bg-blue-50 border-blue-200",
            textClass: "text-blue-800",
            icon: <FilePlus size={24} className="text-blue-600" />
        };

        if (isLocked) {
            headerTheme = {
                title: `รายละเอียดใบเสนอราคา: ${currentQuot.quotationNo}`,
                subtitle: `โหมดอ่านอย่างเดียว (Read-Only) - สถานะ: ${currentQuot.status}`,
                bgClass: "bg-red-50 border-red-200",
                textClass: "text-red-800",
                icon: <Shield size={24} className="text-red-600" />
            };
        } else if (isEditing) {
            headerTheme = {
                title: `แก้ไขใบเสนอราคา: ${currentQuot.quotationNo}`,
                subtitle: `กำลังแก้ไขข้อมูล (Revision: ${currentQuot.revision || 0})`,
                bgClass: "bg-amber-50 border-amber-200",
                textClass: "text-amber-800",
                icon: <Edit size={24} className="text-amber-600" />
            };
        }

        const renderPrintConfig = (item, itemIndex, colorIndex) => {
            const stateField = colorIndex === 1 ? 'printBlocks1' : 'printBlocks2';
            const colorField = colorIndex === 1 ? 'printColorId1' : 'printColorId2';
            const blocks = item[stateField] || [];
            return (
                <div className="border border-blue-100 rounded-xl p-5 bg-blue-50/20 mb-6 shadow-sm">
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-100 pb-2"><Droplet size={18} className="text-blue-500" /> พิมพ์สีที่ {colorIndex}</h4>
                    <div className="mb-6">
                        <div className="mb-4">
                            <InputGroup label={`1.${colorIndex}.1 เลือกสี (Master Data)`} type="select" options={printColors.map(c => ({label: `${c.codeName} - ${c.globalName}`, value: c.id}))} value={item[colorField] || ''} onChange={(v) => handleUpdateItem(itemIndex, colorField, v)} placeholder="-- เลือกสี --" />
                        </div>
                        <div><Button variant="primary" icon={Plus} onClick={() => handleAddBlock(itemIndex, colorIndex)} className="w-full md:w-auto shadow-sm">{` 1.${colorIndex}.2 เพิ่มแบบพิมพ์ (Max 30)`}</Button></div>
                    </div>
                    <div className="space-y-4">
                        {blocks.map((b) => (
                            <div key={b.id} className="relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                                <button onClick={() => handleRemoveBlock(itemIndex, colorIndex, b.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1 bg-gray-50 rounded-full hover:bg-red-50"><X size={16} /></button>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pr-8">
                                    <div className="md:col-span-1"><InputGroup label="เลือกแบบพิมพ์" type="select" options={printBlocks.map(pb => ({label: pb.codeName, value: pb.id}))} value={b.typeId || ''} onChange={(v) => handleUpdateBlock(itemIndex, colorIndex, b.id, 'typeId', v)} placeholder="-- เลือกบล็อค --" /></div>
                                    <div className="md:col-span-1"><InputGroup label="กว้าง (นิ้ว)" type="number" value={b.w || ''} onChange={(v) => handleUpdateBlock(itemIndex, colorIndex, b.id, 'w', v)} /></div>
                                    <div className="md:col-span-1"><InputGroup label="ยาว (นิ้ว)" type="number" value={b.l || ''} onChange={(v) => handleUpdateBlock(itemIndex, colorIndex, b.id, 'l', v)} /></div>
                                    <div className="md:col-span-1"><InputGroup label="ราคา (฿)" type="number" value={b.price || ''} readOnly className="bg-gray-50 font-semibold text-blue-600" /></div>
                                    {(b.w && b.l && b.typeId) ? (
                                        <div className="md:col-span-4 mt-1 flex flex-wrap items-center gap-2 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-gray-700">
                                            <span className="font-semibold text-blue-800">🧮 วิธีคิดราคาบล็อค:</span> <span>{b.w} × {b.l} <span className="text-xs text-gray-500">ตร.นิ้ว</span></span> <span className="text-xs text-blue-400">×</span> <span>{printBlocks.find(pb => pb.id.toString() === b.typeId.toString())?.price || 0} <span className="text-xs text-gray-500">฿/ตร.นิ้ว</span></span><span className="text-blue-400">=</span> <span className="font-bold text-gray-900 text-base">{(parseFloat(b.price) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ฿</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
                {/* 🌟 2. ดึงสีและข้อความจาก Theme มาแสดงผล */}
                <div className={`p-4 border-b flex justify-between items-center rounded-t-xl sticky top-0 z-40 shadow-sm transition-colors duration-300 ${headerTheme.bgClass}`}>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => { if(window.confirm('คุณต้องการออกจากหน้านี้ใช่หรือไม่? ข้อมูลที่ยังไม่ได้บันทึกจะสูญหาย')) { setQuotationView('list'); } }} 
                            className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-300 shadow-sm" title="กลับไปหน้ารายการ"
                        >
                            <ChevronLeft size={20} className="text-gray-700" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                {headerTheme.icon}
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${headerTheme.textClass}`}>{headerTheme.title}</h2>
                                <p className={`text-sm font-medium ${headerTheme.textClass} opacity-80`}>{headerTheme.subtitle}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* ปุ่มคัดลอก: โชว์เสมอถ้ามี ID บิลแล้ว */}
                        {currentQuot.id && (
                            <Button variant="outline" icon={Copy} onClick={() => handleDuplicateQuotation(currentQuot)} className="bg-white">
                                คัดลอกสร้างใบใหม่
                            </Button>
                        )}
                        
                        {/* 🌟 (อัปเดต) ซ่อนปุ่ม Save ถ้าเอกสารถูกล็อคไปแล้ว */}
                        {!isLocked && <Button variant="primary" icon={Save} onClick={handleSaveQuotation}>บันทึกใบเสนอราคา</Button>}
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="border rounded-lg p-5 border-blue-100 bg-blue-50/20 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><User size={18} className="text-blue-600"/> 1. ข้อมูลลูกค้า (Customer Information)</h3>
                                <Button variant="outline" icon={Plus} className="!py-1.5 !px-3 text-sm" onClick={handleCreateCustomerFromQuotation}>สร้างลูกค้าใหม่</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหาลูกค้าเก่า</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <select 
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                                            value={currentQuot.customerId}
                                            onChange={(e) => {
                                                const cust = customers.find(c => c.id.toString() === e.target.value);
                                                setCurrentQuot({...currentQuot, customerId: e.target.value, customerName: cust ? cust.name : ''});
                                            }}
                                        >
                                            <option value="">-- พิมพ์ชื่อเพื่อค้นหา --</option>
                                            {customers.map(c => (<option key={c.id} value={c.id}>{c.name} - {c.company}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-span-1 p-3 bg-white rounded border text-sm text-gray-600">
                                    {currentQuot.customerName ? <span className="font-semibold text-blue-600">{currentQuot.customerName}</span> : 'ยังไม่ได้เลือกลูกค้า'}
                                </div>
                            </div>
                        

                        {/* 🌟🌟🌟 วนลูปกล่องแต่ละรายการ (Item Group: Box, Print, DieCut) 🌟🌟🌟 */}
                        {currentQuot.items.map((item, index) => {
                            const selectedBoxStyle = boxStyles.find(b => b.id.toString() === item.boxStyleId);
                            const iDetail = totals.itemsDetail[index] || {};
                            const isCollapsed = collapsedItems[item.id];

                            return (
                                <div key={item.id} className="bg-white rounded-xl shadow-md border-2 border-indigo-100 overflow-hidden relative transition-all">
                                    
                                    {/* 🌟 Header ของแต่ละ Item (กดเพื่อยุบ/ขยายได้) */}
                                    <div 
                                        className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center cursor-pointer hover:bg-indigo-100 transition-colors"
                                        onClick={() => setCollapsedItems(prev => ({...prev, [item.id]: !prev[item.id]}))}
                                    >
                                        <div>
                                            <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                                                <Package size={20}/> 
                                                กล่องรายการที่ {index + 1}
                                                <span className="text-sm font-normal bg-white px-2 py-0.5 rounded-full text-indigo-600 ml-2 shadow-sm border border-indigo-100">
                                                    {isCollapsed ? '▼ ขยาย' : '▲ ยุบ'}
                                                </span>
                                            </h3>
                                            {/* แสดงข้อมูลสรุปตอนยุบหน้าจอ */}
                                            {isCollapsed && (
                                                <div className="text-sm text-indigo-600 mt-1 flex gap-4">
                                                    <span>📦 {selectedBoxStyle?.codeName || 'ไม่ระบุรูปแบบ'}</span>
                                                    <span>📐 {item.dimW || 0} x {item.dimD || 0} x {item.dimH || 0} cm</span>
                                                </div>
                                            )}
                                        </div>

                                        {currentQuot.items.length > 1 && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveItem(index); }} 
                                                className="text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm font-semibold transition-colors border border-red-200 bg-white"
                                            >
                                                <Trash2 size={16}/> ลบรายการนี้
                                            </button>
                                        )}
                                    </div>

                                    {/* 🌟 เนื้อหาภายใน (ซ่อนเมื่อ isCollapsed = true) */}
                                    {!isCollapsed && (
                                        <div className="p-6 space-y-8 animate-in fade-in duration-300">
                                            {/* 2. Box Specification */}
                                            <div>
                                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><Box size={18} className="text-orange-500"/> 2. ข้อมูลสินค้า (Product Specification)</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <InputGroup 
                                                            label="เลือกรูปแบบกล่อง (Box Style)" type="select" required
                                                            options={boxStyles.map(b => ({label: `${b.codeName} - ${b.globalName}`, value: b.id}))}
                                                            value={item.boxStyleId} onChange={(v) => handleUpdateItem(index, 'boxStyleId', v)}
                                                        />
                                                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                                            <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-1"><Ruler size={14}/> ระบุขนาดกล่อง (cm)</h4>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <InputGroup label="W" type="number" min="0" placeholder="0" value={item.dimW} onChange={(v) => handleUpdateItem(index, 'dimW', v)} />
                                                                <InputGroup label="D" type="number" min="0" placeholder="0" value={item.dimD} onChange={(v) => handleUpdateItem(index, 'dimD', v)} />
                                                                <InputGroup label="H" type="number" min="0" placeholder="0" value={item.dimH} onChange={(v) => handleUpdateItem(index, 'dimH', v)} />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                                <InputGroup label="G (กาว)" type="number" min="0" placeholder="3" value={item.dimG} onChange={(v) => handleUpdateItem(index, 'dimG', v)} />
                                                                <InputGroup label="M (พับ)" type="number" min="0" placeholder="0.5" value={item.dimM} onChange={(v) => handleUpdateItem(index, 'dimM', v)} />
                                                            </div>
                                                        </div>
                                                        {/* 🌟 3. กรองเฉพาะกระดาษ Active และทำการ Snapshot ราคา */}
                                                        {(() => {
                                                            const availablePapers = paperTypes.filter(p => p.isActive !== false || p.id?.toString() === item.paperTypeId?.toString());
                                                            return (
                                                                <InputGroup 
                                                                    label="เลือกเกรดกระดาษ (Paper Type)" type="select" required
                                                                    options={availablePapers.map(p => ({
                                                                        label: `${p.isActive === false ? '[ยกเลิกแล้ว] ' : ''}${p.codeName} (${p.flute}-Flute) - ${p.price} ฿/ตร.ฟุต`, 
                                                                        value: p.id
                                                                    }))}
                                                                    value={item.paperTypeId} 
                                                                    onChange={(v) => {
                                                                        const selectedPaper = paperTypes.find(p => p.id?.toString() === v?.toString());
                                                                        const newItems = [...currentQuot.items];
                                                                        newItems[index].paperTypeId = v;
                                                                        // 📌 บันทึกราคา ณ ปัจจุบัน ฝังลงไปในบิลนี้เลย!
                                                                        newItems[index].paperPriceSnapshot = selectedPaper ? parseFloat(selectedPaper.price || 0) : 0;
                                                                        setCurrentQuot({ ...currentQuot, items: newItems });
                                                                    }}
                                                                />
                                                            );
                                                        })()}
                                                        {iDetail.formulaStr && (
                                                            <details className="group border border-blue-200 rounded-lg bg-white shadow-sm">
                                                                <summary className="w-full bg-blue-50/50 px-4 py-3 flex justify-between items-center text-blue-800 font-semibold hover:bg-blue-100 transition-colors cursor-pointer list-none">
                                                                    <div className="flex items-center gap-2"><span>🧮 แสดงวิธีคิดราคาต้นทุนกระดาษ (Cost Breakdown)</span></div><span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
                                                                </summary>
                                                                <div className="p-5 text-sm space-y-4 text-gray-700">
                                                                    <div className="flex flex-col md:flex-row md:justify-between border-b border-gray-100 pb-3 gap-2">
                                                                        <span className="font-medium text-gray-500 min-w-[150px]">1. สูตรพื้นที่:</span><span className="font-mono bg-gray-50 px-2 py-1 rounded text-blue-600 border border-gray-200 text-right break-all">{iDetail.formulaStr}</span>
                                                                    </div>
                                                                    <div className="flex flex-col md:flex-row md:justify-between border-b border-gray-100 pb-3 gap-2">
                                                                        <span className="font-medium text-gray-500 min-w-[150px]">2. แทนค่า:</span><span className="font-mono text-gray-600 text-right break-all">{iDetail.safeFormula?.replace(/\bW\b/gi, item.dimW||0).replace(/\bD\b/gi, item.dimD||0).replace(/\bH\b/gi, item.dimH||0).replace(/\bG\b/gi, item.dimG||0).replace(/\bM\b/gi, item.dimM||0)}</span>
                                                                    </div>
                                                                    <div className="flex flex-col md:flex-row md:justify-between border-b border-gray-100 pb-3 gap-2">
                                                                        <span className="font-medium text-gray-500 min-w-[150px]">3. พื้นที่:</span>
                                                                        <div className="text-right"><div className="font-semibold">{iDetail.areaSqCm?.toLocaleString(undefined, {maximumFractionDigits: 2})} ตร.ซม.</div><div className="text-xs text-gray-400 mt-1">÷ 929.0304 = <span className="text-blue-600 font-medium">{iDetail.areaSqFt?.toLocaleString(undefined, {maximumFractionDigits: 4})} ตร.ฟุต</span></div></div>
                                                                    </div>
                                                                    <div className="flex flex-col md:flex-row md:justify-between items-center pt-2 gap-2 bg-green-50 p-3 rounded-lg border border-green-100">
                                                                        <span className="font-bold text-green-800">4. สรุปต้นทุนกระดาษ/ใบ:</span>
                                                                        <div className="text-right flex items-center justify-end flex-wrap"><span className="text-sm text-green-700">{iDetail.areaSqFt?.toLocaleString(undefined, {maximumFractionDigits: 4})} ตร.ฟุต × {iDetail.paperPrice} ฿</span><span className="mx-2 text-green-400">=</span><span className="font-black text-xl text-green-700 underline decoration-green-300 underline-offset-4">{iDetail.boxCost?.toLocaleString(undefined, {maximumFractionDigits: 4})} ฿</span></div>
                                                                    </div>
                                                                </div>
                                                            </details>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center p-2 min-h-[300px]">
                                                            {selectedBoxStyle ? (selectedBoxStyle.baseType === 'OTHER' ? (selectedBoxStyle.imageUrl ? <img src={selectedBoxStyle.imageUrl} alt="Box Preview" className="max-h-[300px] object-contain rounded" /> : <div className="text-center text-gray-400"><Box size={32} className="mx-auto mb-2 opacity-20" /><p className="text-sm">กล่องรูปแบบพิเศษ</p></div>) : (<BoxSchematic baseType={selectedBoxStyle.baseType} codeName={selectedBoxStyle.codeName} globalName={selectedBoxStyle.globalName} dimensions={{ W: item.dimW, D: item.dimD, H: item.dimH, G: item.dimG, M: item.dimM }} />)) : (<div className="text-center text-gray-400"><Box size={32} className="mx-auto mb-2 opacity-20" /><p className="text-sm">เลือกรูปแบบกล่องเพื่อดูแบบ</p></div>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-6 border-t border-gray-100">
                                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><Palette size={18} className="text-purple-500"/> 3. การพิมพ์ (Printing Options)</h4>
                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">เลือกการพิมพ์</label>
                                                    <div className="flex gap-4">
                                                        {['none', '1color', '2colors'].map(type => (
                                                            <label key={type} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${item.printType === type ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                                <input type="radio" className="w-4 h-4 text-purple-600" checked={item.printType === type} onChange={() => handleUpdateItem(index, 'printType', type)} /> {type === 'none' ? 'ไม่พิมพ์' : type === '1color' ? 'พิมพ์ 1 สี' : 'พิมพ์ 2 สี'}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                {item.printType !== 'none' && (
                                                    <div className="space-y-6">
                                                        {renderPrintConfig(item, index, 1)}
                                                        {item.printType === '2colors' && renderPrintConfig(item, index, 2)}
                                                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><InputGroup label="ค่าสีต่อกล่อง (Color Cost per Box)" type="number" placeholder="0.00" suffix="฿/กล่อง" value={item.printCostPerBox} onChange={(v) => handleUpdateItem(index, 'printCostPerBox', v)} helpText="ใส่ค่าใช้จ่ายเฉลี่ยของสีที่ใช้ต่อใบ" /></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-6 border-t border-gray-100">
                                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">✂️ 4. ค่าใบมีด (Die Cut)</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                    <div className="md:col-span-2"><InputGroup label="เลือกแบบใบมีด (Master Data)" type="select" options={[{label: '-- ไม่ใช้ใบมีด --', value: ''}, ...dieCutMolds.map(d => ({label: `${d.codeName} (${d.price} ฿/ตร.นิ้ว)`, value: d.id}))]} value={item.dieCutId || ''} onChange={(v) => handleUpdateItem(index, 'dieCutId', v)} /></div>
                                                    <InputGroup label="กว้าง (นิ้ว)" type="number" value={item.dieCutW || ''} onChange={(v) => handleUpdateItem(index, 'dieCutW', v)} />
                                                    <InputGroup label="ยาว (นิ้ว)" type="number" value={item.dieCutL || ''} onChange={(v) => handleUpdateItem(index, 'dieCutL', v)} />
                                                </div>
                                                {item.dieCutId && item.dieCutW && item.dieCutL && (() => {
                                                    const dcW = parseFloat(item.dieCutW) || 0; const dcL = parseFloat(item.dieCutL) || 0; const mold = dieCutMolds.find(d => d.id.toString() === item.dieCutId); const moldPrice = mold ? parseFloat(mold.price) : 0;
                                                    return (
                                                        <div className="mt-4 flex flex-wrap items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-gray-700">
                                                            <span className="font-semibold text-orange-800">🧮 วิธีคิดราคาใบมีด:</span> <span>{dcW} × {dcL} <span className="text-xs text-gray-500">ตร.นิ้ว</span></span> <span className="text-xs text-orange-400">×</span> <span>{moldPrice} <span className="text-xs text-gray-500">฿/ตร.นิ้ว</span></span> <span className="text-orange-400">=</span> <span className="font-black text-lg text-orange-700">{((dcW * dcL) * moldPrice).toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-100 mt-6">
                                                <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2"><Package size={18}/> 5. จำนวนผลิต (เฉพาะรายการนี้)</h4>
                                                <div className="max-w-xs">
                                                    <InputGroup label="ระบุจำนวน (Quantity)" type="number" value={item.quantity} onChange={(v) => handleUpdateItem(index, 'quantity', v)} suffix="ใบ" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="flex justify-center pt-2 mb-8">
                            <button onClick={handleAddItem} className="flex items-center gap-2 bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white px-8 py-3 rounded-full font-bold shadow-sm transition-all hover:scale-105 active:scale-95">
                                <Plus size={20}/> + เพิ่มกล่องรายการใหม่ (Add Item)
                            </button>
                        </div>

                        <div className="border rounded-lg p-5 border-gray-200 bg-white shadow-sm">
                             <div className="mb-6 pb-2 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Truck size={18} className="text-gray-500"/> ข้อมูลส่วนกลาง (Logistics & Setup)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">การขนส่ง (Shipping)</label>
                                    <div className="flex gap-4 mb-2">
                                         <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="shipType" checked={currentQuot.shippingType === 'pickup'} onChange={() => setCurrentQuot({...currentQuot, shippingType: 'pickup'})}/> ลูกค้ามารับเอง</label>
                                         <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="shipType" checked={currentQuot.shippingType === 'delivery'} onChange={() => setCurrentQuot({...currentQuot, shippingType: 'delivery'})}/> จัดส่งให้</label>
                                    </div>
                                    {currentQuot.shippingType === 'delivery' && (<InputGroup placeholder="ค่าขนส่ง (เหมา)" type="number" value={currentQuot.shippingCost} onChange={(v) => setCurrentQuot({...currentQuot, shippingCost: v})} />)}
                                </div>
                                <div className="space-y-4">
                                    <InputGroup label="ค่าเปิดคำสั่งซื้อ/Setup (Setup Cost)" type="number" placeholder="0.00" value={currentQuot.setupCost} onChange={(v) => setCurrentQuot({...currentQuot, setupCost: v})} helpText="เช่น ค่าเพลทตั้งต้นรวม" />
                                    <InputGroup label="คาดการณ์วันรับสินค้า (Lead Time)" type="number" value={currentQuot.leadTime} onChange={(v) => setCurrentQuot({...currentQuot, leadTime: v})} suffix="วัน" />
                                </div>
                            </div>
                        </div>

                        {/* 🌟 นำโค้ดก้อนนี้ไปวางต่อท้ายได้เลย 🌟 */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">รูปแบบการแสดงราคาใน PDF</label>
                            <div className="flex flex-col xl:flex-row gap-3">
                                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${currentQuot.displayMode !== 'detailed' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <input type="radio" className="w-4 h-4 text-blue-600" checked={currentQuot.displayMode !== 'detailed'} onChange={() => setCurrentQuot({...currentQuot, displayMode: 'per-box'})}/> 
                                    <span className="text-sm">รวมราคาต่อใบ (Default)</span>
                                </label>
                                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${currentQuot.displayMode === 'detailed' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <input type="radio" className="w-4 h-4 text-blue-600" checked={currentQuot.displayMode === 'detailed'} onChange={() => setCurrentQuot({...currentQuot, displayMode: 'detailed'})}/> 
                                    <span className="text-sm">แจกแจงรายละเอียด</span>
                                </label>
                            </div>
                        </div>
                        </div>

                        <div className="border rounded-lg p-5 border-gray-200 bg-white shadow-sm">
                             <div className="mb-6 pb-2 border-b border-gray-100">
                                 <h3 className="font-semibold text-gray-800 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500"/> การเงิน (Financials)</h3>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <InputGroup label="1. กำไรกระดาษ+สี" type="number" value={currentQuot.profitMarginBox} onChange={(v) => setCurrentQuot({...currentQuot, profitMarginBox: v})} suffix="%" />
                                <InputGroup label="2. กำไรบล็อคพิมพ์" type="number" value={currentQuot.profitMarginBlock} onChange={(v) => setCurrentQuot({...currentQuot, profitMarginBlock: v})} suffix="%" />
                                <InputGroup label="3. กำไรใบมีด" type="number" value={currentQuot.profitMarginDieCut} onChange={(v) => setCurrentQuot({...currentQuot, profitMarginDieCut: v})} suffix="%" />
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                <div className="md:col-start-3">
                                    <InputGroup label="ส่วนลดรวมท้ายบิล (Discount)" type="number" value={currentQuot.discount} onChange={(v) => setCurrentQuot({...currentQuot, discount: v})} suffix="%" />
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                         <div className="sticky top-24 space-y-4">
                             <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                                 <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white text-center">
                                     <h3 className="text-sm font-medium opacity-80 mb-1">ยอดรวมสุทธิ (Net Total)</h3>
                                     <div className="text-4xl font-bold flex items-center justify-center gap-1">
                                         {totals.netTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-lg font-normal opacity-70">฿</span>
                                     </div>
                                 </div>
                                 <div className="p-6 space-y-4">
                                     <h4 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                                        <Calculator size={16}/> สรุปรายการ (Summary)
                                     </h4>
                                     
                                     <div className="space-y-4 text-sm mt-4">
                                         {/* 🌟 วนลูปโชว์ราคาแยกตามกล่องแต่ละใบ */}
                                         {(totals.itemsDetail || []).map((detail, idx) => (
                                             <div key={idx} className="border-b border-gray-100 pb-3">
                                                 <div className="flex justify-between items-start mb-1">
                                                     <span className="font-bold text-blue-800">
                                                         {idx + 1}. กล่องรายการที่ {idx + 1}
                                                         <span className="text-xs text-gray-500 block font-normal">{detail.dim} cm ({detail.boxName})</span>
                                                     </span>
                                                     <span className="font-bold text-gray-800">
                                                         {((detail.boxCost * detail.qty) + detail.blockCost + detail.dieCutCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ฿
                                                     </span>
                                                 </div>
                                                 <div className="text-xs text-gray-500 mb-2 pl-4">จำนวน {detail.qty.toLocaleString()} ใบ (@{detail.boxCost.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿/ใบ รวมค่าสี)</div>
                                                 
                                                 {/* ค่าบล็อคของกล่องนี้ */}
                                                 {(detail.blockDetails || []).map((b, i) => (
                                                     <div key={i} className="flex justify-between text-xs text-gray-600 pl-4 mb-1">
                                                         <span>- {b.name} {b.size} นิ้ว</span>
                                                         <span>{b.price.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                                     </div>
                                                 ))}
                                                 
                                                 {/* ค่าใบมีดของกล่องนี้ */}
                                                 {detail.dieCutDetail && (
                                                     <div className="flex justify-between text-xs text-gray-600 pl-4 mb-1">
                                                         <span>- เพลทใบมีด {detail.dieCutDetail.size} นิ้ว</span>
                                                         <span>{detail.dieCutDetail.price.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                                     </div>
                                                 )}
                                             </div>
                                         ))}

                                         {/* ค่าใช้จ่ายส่วนกลาง */}
                                         {(totals.shipCost > 0 || totals.setupCost > 0) && (
                                             <div className="pt-2">
                                                 {totals.shipCost > 0 && (
                                                     <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                         <div>- ค่าบริการจัดส่งส่วนกลาง</div>
                                                         <div>{totals.shipCost.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</div>
                                                     </div>
                                                 )}
                                                 {totals.setupCost > 0 && (
                                                     <div className="flex justify-between text-xs text-gray-600">
                                                         <div>- ค่า Setup ส่วนกลาง</div>
                                                         <div>{totals.setupCost.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</div>
                                                     </div>
                                                 )}
                                             </div>
                                         )}
                                     </div>

                                     {/* สรุปยอด Grand Total ด้านล่าง */}
                                     <div className="pt-4 border-t border-gray-300 space-y-2">
                                         <div className="flex justify-between text-sm text-gray-600">
                                             <span>รวมราคาขาย (ก่อนส่วนลด)</span>
                                             <span>{(totals.totalWithProfit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ฿</span>
                                         </div>
                                         <div className="flex justify-between text-sm text-red-500">
                                             <span>- ส่วนลด ({currentQuot.discount || 0}%)</span>
                                             <span>{((totals.totalWithProfit || 0) - (totals.totalAfterDiscount || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ฿</span>
                                         </div>
                                          <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t">
                                             <span>ยอดสุทธิ (ก่อน VAT)</span>
                                             <span>{(totals.totalAfterDiscount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ฿</span>
                                         </div>
                                         <div className="flex justify-between text-sm text-gray-500">
                                             <span>VAT 7%</span>
                                             <span>{((totals.netTotal || 0) - (totals.totalAfterDiscount || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ฿</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800 shadow-sm">
                                 <p className="font-semibold mb-1">💡 Tips สำหรับใบเสนอราคาหลายรายการ:</p>
                                 <ul className="list-disc pl-4 space-y-1 text-blue-600">
                                     <li>สามารถกดปุ่ม "เพิ่มกล่องรายการใหม่" ด้านล่างซ้ายได้ไม่จำกัด</li>
                                     <li>กำไรและส่วนลดจะถูกกระจายคำนวณลงในแต่ละกล่องให้อัตโนมัติเมื่อสร้าง PDF</li>
                                 </ul>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        );
    }
  };

  // --- Modals ---

  const renderConfirmationModal = () => {
    let title = "ยืนยันการทำรายการ";
    let message = "คุณต้องการดำเนินการต่อหรือไม่?";
    let confirmColor = "primary";

    if (!modalMode || ['create', 'edit', 'preview', 'createCustomerFromQuot'].includes(modalMode)) return null;

    if (modalMode === 'delete') {
      title = "ยืนยันการลบข้อมูล";
      message = activeMainTab === 'admin' 
        ? `คุณต้องการลบผู้ใช้งาน "${selectedItem?.email}" ใช่หรือไม่?`
        : activeSubTab === 'customer'
            ? `คุณต้องการลบลูกค้า "${selectedItem?.name}" ใช่หรือไม่?`
            : `คุณต้องการลบข้อมูล "${selectedItem?.codeName}" ใช่หรือไม่?`;
      confirmColor = "danger";
    } else if (modalMode === 'copy') {
      title = "ยืนยันการคัดลอก";
      message = activeMainTab === 'admin'
        ? `คุณต้องการคัดลอกผู้ใช้งาน "${selectedItem?.email}" ใช่หรือไม่?`
        : activeSubTab === 'customer'
            ? `คุณต้องการคัดลอกข้อมูลลูกค้า "${selectedItem?.name}" ใช่หรือไม่?`
            : `คุณต้องการคัดลอกข้อมูล "${selectedItem?.codeName}" ใช่หรือไม่?`;
    } else if (modalMode === 'confirmEdit') {
      title = "ยืนยันการแก้ไข";
      message = activeMainTab === 'admin'
        ? `คุณต้องการแก้ไขข้อมูลผู้ใช้งาน "${selectedItem?.email}" ใช่หรือไม่?`
        : activeSubTab === 'customer'
            ? `คุณต้องการแก้ไขข้อมูลลูกค้า "${selectedItem?.name}" ใช่หรือไม่?`
            : `คุณต้องการแก้ไขข้อมูล "${selectedItem?.codeName}" ใช่หรือไม่?`;
    } else if (modalMode.includes('Save')) {
      title = "บันทึกข้อมูล";
      message = "คุณต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่?";
      confirmColor = "success";
    }

    return (
      <Modal 
        isOpen={true} 
        title={title} 
        onClose={() => setModalMode(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalMode(null)}>ยกเลิก</Button>
            <Button variant={confirmColor} onClick={handleConfirmAction}>ยืนยัน</Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
            <AlertCircle size={24} />
          </div>
          <p className="text-gray-700">{message}</p>
        </div>
      </Modal>
    );
  };

  const renderFormModal = () => {
    if (!['create', 'edit', 'createCustomerFromQuot'].includes(modalMode)) return null;
    const isEdit = modalMode === 'edit';

    let formTitle = "";
    if(activeMainTab === 'admin') formTitle = "ผู้ใช้งานระบบ";
    else if(activeSubTab === 'boxStyle') formTitle = "รูปแบบกล่อง";
    else if(activeSubTab === 'paper') formTitle = "ประเภทกระดาษ";
    else if(activeSubTab === 'printBlock') formTitle = "บล๊อคพิมพ์";
    else if(activeSubTab === 'printColor') formTitle = "สีพิมพ์";
    else if(activeSubTab === 'dieCut') formTitle = "แบบใบมีด";
    else if(activeSubTab === 'customer' || modalMode === 'createCustomerFromQuot') formTitle = "ข้อมูลลูกค้า";

    let formContent = null;

    if (activeMainTab === 'admin') {
        formContent = (
            <>
                <InputGroup label="Email Account" type="email" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} required placeholder="user@company.com" />
                <InputGroup 
                    label="Admin Tier" 
                    type="select" 
                    options={[
                        {label: 'Level 1 - System Admin (Highest)', value: 'Level 1'},
                        {label: 'Level 2 - Approver (Master Data Price)', value: 'Level 2'},
                        {label: 'Level 3 - General App User', value: 'Level 3'}
                    ]}
                    value={formData.tier} 
                    onChange={(v) => setFormData({...formData, tier: v})} 
                />
                <InputGroup label="Note" type="textarea" value={formData.note} onChange={(v) => setFormData({...formData, note: v})} />
            </>
        );
    } else if (activeSubTab === 'customer' || modalMode === 'createCustomerFromQuot') {
        formContent = (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="1. ชื่อเรียก (Short Name)" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} required placeholder="เช่น ร้านป้าแจ่ม" helpText="ใช้สำหรับค้นหาภายในระบบ" />
                    <InputGroup label="3. เลขที่นิติบุคคล" value={formData.taxId} onChange={(v) => setFormData({...formData, taxId: v})} placeholder="13 หลัก" />
                </div>
                <InputGroup label="2. ชื่อบริษัท / ในนามบุคคล (Full Name)" value={formData.company} onChange={(v) => setFormData({...formData, company: v})} placeholder="เช่น บจก. ผลไม้ไทย" />
                
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="6. เบอร์มือถือ 1" value={formData.mobile1} onChange={(v) => setFormData({...formData, mobile1: v})} />
                    <InputGroup label="7. เบอร์มือถือ 2" value={formData.mobile2} onChange={(v) => setFormData({...formData, mobile2: v})} />
                </div>
                
                <InputGroup 
                    label="8. ประเภทอุตสาหกรรมลูกค้า" 
                    type="select" 
                    options={INDUSTRY_TYPES}
                    value={formData.industry} 
                    onChange={(v) => setFormData({...formData, industry: v})} 
                />
                {formData.industry?.includes('อื่นๆ') && (
                     <InputGroup label="ระบุประเภทอื่นๆ" value={formData.industryOther} onChange={(v) => setFormData({...formData, industryOther: v})} placeholder="โปรดระบุ..." />
                )}

                <InputGroup label="4. ที่อยู่จัดส่ง (Shipping Address)" type="textarea" value={formData.addressShip} onChange={(v) => setFormData({...formData, addressShip: v})} rows={2} />
                
                <div className="flex justify-end mb-2">
                     <button className="text-xs text-blue-600 hover:underline flex items-center gap-1" onClick={() => setFormData({...formData, addressBill: formData.addressShip})}>
                        <Copy size={12}/> คัดลอกที่อยู่จัดส่ง
                     </button>
                </div>
                <InputGroup label="5. ที่อยู่ออกใบกำกับภาษี (Billing Address)" type="textarea" value={formData.addressBill} onChange={(v) => setFormData({...formData, addressBill: v})} rows={2} />
                
                <InputGroup label="Note (บันทึกช่วยจำ)" type="textarea" value={formData.note} onChange={(v) => setFormData({...formData, note: v})} />
            </>
        );
    } else if (activeSubTab === 'boxStyle') {
        
        const handleBaseTypeChange = (type) => {
            let newFormula = '';
            if (type === 'RSC') newFormula = '(2*W + 2*D + G + 4*M) * (H + D + 2*M)';
            else if (type === 'FOL') newFormula = '(2*W + 2*D + G + 4*M) * (H + 2*D + 2*M)';

            setFormData({
                ...formData,
                baseType: type,
                formula: newFormula,
                imageUrl: type !== 'OTHER' ? '' : formData.imageUrl // เคลียร์รูปทิ้งถ้ากลับมาเป็นกล่องมาตรฐาน
            });
        };

        // ฟังก์ชันอัปโหลดรูปลง Firebase Storage
        const handleImageUpload = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            setIsUploading(true);
            try {
                // ตั้งชื่อไฟล์ไม่ให้ซ้ำกัน
                const storageRef = ref(storage, `box-images/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef); // เอา URL ที่ได้มาเก็บลงฐานข้อมูล
                
                setFormData({ ...formData, imageUrl: downloadURL });
            } catch (error) {
                console.error("Upload Error:", error);
                alert("อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่");
            } finally {
                setIsUploading(false);
            }
        };

        formContent = (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="ชื่อรหัส (Code Name)" value={formData.codeName} onChange={(v) => setFormData({...formData, codeName: v})} required placeholder="เช่น RSC-01" />
                    <InputGroup label="ชื่อแบบ Global Name" value={formData.globalName} onChange={(v) => setFormData({...formData, globalName: v})} placeholder="เช่น Regular Slotted Container" />
                </div>

                <InputGroup
                    label="รูปแบบกล่อง (Box Type)"
                    type="select"
                    options={[
                        {label: 'กล่องฝาชน (RSC)', value: 'RSC'},
                        {label: 'กล่องฝาเกย (FOL)', value: 'FOL'},
                        {label: 'อื่นๆ (Others)', value: 'OTHER'}
                    ]}
                    value={formData.baseType || 'RSC'}
                    onChange={handleBaseTypeChange}
                    required
                />

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4 shadow-sm">
                    <div className="mb-3 border-b border-blue-200 pb-2">
                        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2"><Ruler size={16}/> คำอธิบายตัวแปร (Variables Definition):</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 text-xs text-blue-700">
                            <div><span className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">W</span> = ความกว้าง (Width)</div>
                            <div><span className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">D</span> = ความลึก/ข้าง (Depth)</div>
                            <div><span className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">H</span> = ความสูง (Height)</div>
                            <div><span className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">G</span> = ลิ้นกาว (Glue Flap)</div>
                            <div><span className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">M</span> = ระยะเผื่อพับ (Margin)</div>
                        </div>
                    </div>
                    <InputGroup 
                        label="สูตรคำนวณพื้นที่กระดาษ (Formula)" 
                        value={formData.formula} 
                        onChange={(v) => setFormData({...formData, formula: v})} 
                        placeholder={formData.baseType === 'OTHER' ? "กรุณากำหนดสูตรของคุณเอง..." : ""}
                    />
                </div>

                {/* ถ้ารูปแบบไม่ใช่ อื่นๆ ให้แสดงภาพจำลอง / ถ้าเป็น อื่นๆ ให้แสดงที่อัปโหลดรูป */}
                {formData.baseType !== 'OTHER' ? (
                    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 w-full text-left flex items-center gap-2">
                            <Eye size={16}/> ภาพจำลองกล่องคลี่ (Live Preview)
                        </h4>
                        <div className="w-full bg-white border border-gray-200 rounded p-2 overflow-hidden flex justify-center pointer-events-none">
                            <BoxSchematic 
                                baseType={formData.baseType || 'RSC'} 
                                dimensions={{W: 'W', D: 'D', H: 'H', G: 'G', M: 'M'}} 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mb-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <h4 className="text-sm font-semibold text-orange-800 w-full text-left flex items-center gap-2 mb-2">
                            <FilePlus size={16}/> อัปโหลดภาพตัวอย่างกล่อง
                        </h4>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                        />
                        {isUploading && <p className="text-xs text-blue-500 mt-2 animate-pulse">กำลังอัปโหลดรูปภาพ...</p>}
                        
                        {/* พรีวิวรูปที่อัปโหลดเสร็จแล้ว */}
                        {formData.imageUrl && !isUploading && (
                            <div className="mt-4 relative inline-block border-2 border-orange-200 rounded p-1 bg-white">
                                <img src={formData.imageUrl} alt="Uploaded Box" className="max-h-40 object-contain rounded" />
                                <button onClick={() => setFormData({...formData, imageUrl: ''})} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600" title="ลบรูป">
                                    <X size={14}/>
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                <InputGroup label="Note (หมายเหตุ)" type="textarea" value={formData.note} onChange={(v) => setFormData({...formData, note: v})} />
            </>
        );
    } else if (activeSubTab === 'paper') {
        formContent = (
            <>
                {/* 🌟 1. เพิ่ม Checkbox สถานะการใช้งาน */}
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                            checked={formData.isActive !== false} 
                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        />
                        <span className="font-bold text-gray-700">สถานะ: เปิดใช้งาน (Active)</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-7">หากนำติ๊กถูกออก กระดาษนี้จะถูกซ่อนไม่ให้เลือกในบิลใหม่ แต่บิลเก่าจะยังแสดงผลได้ปกติ</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="ชื่อรหัส (Code Name)" value={formData.codeName} onChange={(v) => setFormData({...formData, codeName: v})} required placeholder="e.g. P-KA125-B" />
                    <InputGroup label="Global Name" value={formData.globalName} onChange={(v) => setFormData({...formData, globalName: v})} placeholder="e.g. KA125/CA125 B-Flute" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="ลอน (Flute)" type="select" options={['A','B','C','E','BC','CE']} value={formData.flute} onChange={(v) => setFormData({...formData, flute: v})} />
                    <InputGroup label="ชั้นผนัง (Wall)" type="select" options={['Single Wall','Double Wall']} value={formData.wallType} onChange={(v) => setFormData({...formData, wallType: v})} />
                </div>

                {/* --- ระบบจานสี (Color Swatches) --- */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-3">เลือกสีกระดาษ (Material Code)</label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { code: 'KA', name: 'น้ำตาลทอง', color: '#d4a373' },
                            { code: 'KI', name: 'น้ำตาลอ่อน', color: '#e9d8a6' },
                            { code: 'KS', name: 'ขาวนวล', color: '#fefae0' },
                            { code: 'CA', name: 'น้ำตาลเข้ม', color: '#bc6c25' },
                            { code: 'W', name: 'ขาวสว่าง', color: '#ffffff' }
                        ].map(mat => (
                            <button
                                key={mat.code}
                                type="button"
                                onClick={() => setFormData({...formData, materialCode: mat.code})}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                    formData.materialCode === mat.code 
                                    ? 'border-blue-500 bg-blue-50 shadow-md scale-105' 
                                    : 'border-gray-200 bg-white hover:bg-gray-100'
                                }`}
                            >
                                <div className="w-5 h-5 rounded-full border shadow-sm" style={{backgroundColor: mat.color}}></div>
                                <span className="text-sm font-semibold text-gray-700">{mat.code} <span className="text-xs font-normal text-gray-500">({mat.name})</span></span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <InputGroup 
                    label="หน้ากว้างที่ผลิตได้ (หน่วย: นิ้ว)" 
                    value={formData.widths} 
                    onChange={(v) => setFormData({...formData, widths: v})} 
                    placeholder="เช่น 48, 60" 
                    helpText="ระบุหน้ากว้างเป็นนิ้วเสมอ (คั่นด้วยลูกน้ำ)"
                />
                
                <div className="grid grid-cols-3 gap-4">
                    <InputGroup 
                        label="ราคาต่อตารางฟุต (Sq.ft)" 
                        type="number" 
                        value={formData.price} 
                        onChange={(v) => setFormData({...formData, price: v})} 
                        placeholder="0.00"
                    />
                    <InputGroup label="MOQ (ขั้นต่ำ)" type="number" value={formData.moq} onChange={(v) => setFormData({...formData, moq: v})} />
                    <InputGroup label="Supplier Name" value={formData.supplier} onChange={(v) => setFormData({...formData, supplier: v})} />
                </div>
                <InputGroup label="Note" type="textarea" value={formData.note} onChange={(v) => setFormData({...formData, note: v})} />
            </>
        );
    
    } else if (activeSubTab === 'printBlock') {
        formContent = (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="ชื่อรหัส (Code Name)" value={formData.codeName} onChange={(v) => setFormData({...formData, codeName: v})} required placeholder="e.g. BLK-001" />
                    <InputGroup label="Global Name" value={formData.globalName} onChange={(v) => setFormData({...formData, globalName: v})} />
                </div>
                <InputGroup label="วัสดุ (Material)" type="select" options={['บล็อคแกะ (Rubber)', 'บล็อคหล่อ (Polymer)']} value={formData.material} onChange={(v) => setFormData({...formData, material: v})} />
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded mb-4 border border-gray-100">
                    {/* เปลี่ยนบังคับเป็น นิ้ว */}
                    <InputGroup label="ขนาดความกว้างไม่เกิน (นิ้ว)" type="number" value={formData.maxWidth} onChange={(v) => setFormData({...formData, maxWidth: v})} placeholder="เช่น 10" />
                     <InputGroup label="ขนาดความยาวไม่เกิน (นิ้ว)" type="number" value={formData.maxLength} onChange={(v) => setFormData({...formData, maxLength: v})} placeholder="เช่น 20" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {/* เปลี่ยนราคาเป็นต่อ ตารางนิ้ว */}
                    <InputGroup label="ราคาต่อตารางนิ้ว (Sq.inch)" type="number" value={formData.price} onChange={(v) => setFormData({...formData, price: v})} placeholder="0.00" />
                    <InputGroup label="MOQ (ขั้นต่ำ)" type="number" value={formData.moq} onChange={(v) => setFormData({...formData, moq: v})} />
                    <InputGroup label="Supplier Name" value={formData.supplier} onChange={(v) => setFormData({...formData, supplier: v})} />
                </div>
                <InputGroup label="Note" type="textarea" value={formData.note} onChange={(v) => setFormData({...formData, note: v})} />
            </>
        );
    } else if (activeSubTab === 'printColor') {
        formContent = (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="ชื่อรหัส (Code Name)" value={formData.codeName} onChange={(v) => setFormData({...formData, codeName: v})} required placeholder="e.g. INK-001" />
                    <InputGroup label="Global Name" value={formData.globalName} onChange={(v) => setFormData({...formData, globalName: v})} placeholder="e.g. Pantone 485C" />
                </div>
                <div className="p-4 bg-gray-50 border rounded-lg mb-4 flex gap-6 items-start">
                    <div className="flex-1">
                         <InputGroup label="C,L,M, V Code (Hex/Color)" type="color" value={formData.clmvCode} onChange={(v) => setFormData({...formData, clmvCode: v})} />
                    </div>
                    <div className="flex flex-col items-center">
                        <label className="text-sm text-gray-500 mb-2">Color Preview</label>
                        <div className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm" style={{backgroundColor: formData.clmvCode}}></div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <InputGroup label="ราคาต่อหน่วย" type="number" value={formData.price} onChange={(v) => setFormData({...formData, price: v})} />
                    <InputGroup label="MOQ (ลิตร)" type="number" value={formData.moq} onChange={(v) => setFormData({...formData, moq: v})} />
                    <InputGroup label="Supplier Name" value={formData.supplier} onChange={(v) => setFormData({...formData, supplier: v})} />
                </div>
                <InputGroup label="Note" type="textarea" value={formData.note} onChange={(v) => setFormData({...formData, note: v})} />
            </>
        );
    } else if (activeSubTab === 'dieCut') {
        formContent = (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="ชื่อรหัส (Code Name)" value={formData.codeName} onChange={(v) => setFormData({...formData, codeName: v})} required placeholder="e.g. DIE-001" />
                    <InputGroup label="Global Name" value={formData.globalName} onChange={(v) => setFormData({...formData, globalName: v})} />
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded mb-4 border border-gray-100">
                    {/* เปลี่ยนบังคับเป็น นิ้ว */}
                    <InputGroup label="ขนาดความกว้างไม่เกิน (นิ้ว)" type="number" value={formData.maxWidth} onChange={(v) => setFormData({...formData, maxWidth: v})} placeholder="เช่น 40" />
                     <InputGroup label="ขนาดความยาวไม่เกิน (นิ้ว)" type="number" value={formData.maxLength} onChange={(v) => setFormData({...formData, maxLength: v})} placeholder="เช่น 60" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {/* เปลี่ยนราคาเป็นต่อ ตารางนิ้ว */}
                    <InputGroup label="ราคาต่อตารางนิ้ว (Sq.inch)" type="number" value={formData.price} onChange={(v) => setFormData({...formData, price: v})} placeholder="0.00" />
                    <InputGroup label="MOQ (ขั้นต่ำ)" type="number" value={formData.moq} onChange={(v) => setFormData({...formData, moq: v})} />
                    <InputGroup label="Supplier Name" value={formData.supplier} onChange={(v) => setFormData({...formData, supplier: v})} />
                </div>
                <InputGroup label="Note" type="textarea" value={formData.note} onChange={(v) => setFormData({...formData, note: v})} />
            </>
        );
    }

    return (
      <Modal
        isOpen={true}
        title={isEdit ? `แก้ไข ${formTitle}` : `เพิ่ม ${formTitle}`}
        onClose={() => setModalMode(null)}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalMode(null)}>ยกเลิก</Button>
            <Button variant="primary" icon={Save} onClick={handleSaveForm}>{isEdit ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}</Button>
          </>
        }
      >
        <div className="space-y-4">
            {formContent}
            {isEdit && (
             <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <div><span className="block font-semibold">Created By:</span> {formData.createdBy} <br/> {formData.createdDate}</div>
                <div><span className="block font-semibold">Last Modified By:</span> {formData.lastModifiedBy} <br/> {formData.lastModifiedDate}</div>
             </div>
            )}
        </div>
      </Modal>
    );
  };

const renderPreviewModal = () => {
      if (modalMode !== 'preview' || !selectedItem || activeSubTab !== 'boxStyle') return null;
      
      return (
        <Modal
            isOpen={true}
            title={`Preview: ${selectedItem.codeName}`}
            onClose={() => setModalMode(null)}
            size="lg"
            footer={<Button variant="secondary" onClick={() => setModalMode(null)}>ปิดหน้าต่าง</Button>}
        >
            <div className="flex flex-col gap-4">
                <div className="text-center mb-2">
                    <h4 className="text-xl font-bold text-gray-800">{selectedItem.globalName || selectedItem.codeName}</h4>
                    <p className="text-gray-500">แบบจำลองโครงสร้างกล่อง</p>
                </div>

                {/* 🌟 เช็คเงื่อนไข: ถ้ารูปแบบเป็น OTHER ให้โชว์รูปภาพ ถ้าไม่ใช่ให้วาดแบบจำลอง */}
                {selectedItem.baseType === 'OTHER' ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center min-h-[300px]">
                        {selectedItem.imageUrl ? (
                            <img 
                                src={selectedItem.imageUrl} 
                                alt={`ภาพตัวอย่าง ${selectedItem.codeName}`} 
                                className="max-h-[400px] max-w-full object-contain rounded-lg shadow-sm" 
                            />
                        ) : (
                            <div className="text-center text-gray-400">
                                <Box size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="font-semibold text-gray-500">กล่องรูปแบบพิเศษ</p>
                                <p className="text-sm">ยังไม่ได้อัปโหลดรูปภาพประกอบ</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm pointer-events-none">
                        <BoxSchematic 
                            baseType={selectedItem.baseType} 
                            codeName={selectedItem.codeName} 
                            globalName={selectedItem.globalName}
                            dimensions={{ W: 'W', D: 'D', H: 'H', G: 'G', M: 'M' }} // โชว์เป็นตัวอักษรแทนตัวเลข
                        />
                    </div>
                )}

                {/* โชว์ Note (ถ้ามี) */}
                {selectedItem.note && (
                   <div className="mt-2 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex gap-2 items-start shadow-sm">
                      <StickyNote size={18} className="mt-0.5 shrink-0 text-yellow-600" />
                      <div>
                          <span className="font-bold block mb-1">Note (หมายเหตุ):</span>
                          {selectedItem.note}
                      </div>
                   </div>
                )}
            </div>
        </Modal>
    );
  };
  // 🌟🌟🌟 จุดที่ 3: ระบบประมวลผลการ Copy-Paste และหน้าต่าง 🌟🌟🌟
  const handleProcessBulkImport = async () => {
        if (!bulkImportData.rawText.trim()) return alert("กรุณาวางข้อมูลตารางในช่องข้อความ");
        if (!bulkImportData.flute) return alert("กรุณาเลือกลอนกระดาษ");
        if (!bulkImportData.supplier) return alert("กรุณาระบุชื่อ Supplier");

        const rows = bulkImportData.rawText.split('\n');
        const newPapers = [];
        
        rows.forEach(row => {
            const cols = row.trim().split(/\t/); // แยกคอลัมน์ด้วยปุ่ม Tab (จากการก๊อปใน Excel/PDF)
            
            // เช็คว่ามีข้อมูลอย่างน้อย 2 คอลัมน์ (ชื่อ และ MOQ) ถึงจะทำงาน
            if (cols.length >= 2 && cols[0].trim() !== '') {
                const originalName = cols[0].trim();
                const moqVal = cols[1] ? cols[1].replace(/,/g, '').trim() : '0';
                const priceVal = cols[2] ? cols[2].replace(/,/g, '').trim() : '0';

                // 1. ดึงรหัสสี (2 ตัวอักษรแรก)
                let materialCode = originalName.substring(0, 2).toUpperCase();
                
                // 2. ประกอบชื่อกระดาษ + Suffix
                const finalCodeName = bulkImportData.suffix ? `${originalName} ${bulkImportData.suffix}`.trim() : originalName;

                // 3. ประกอบ Global Name (รหัสสี + ลอน + ซัพพลายเออร์)
                const globalName = `${materialCode} ${bulkImportData.flute}-Flute ${bulkImportData.supplier}`;

                newPapers.push({
                    codeName: finalCodeName,
                    globalName: globalName,
                    materialCode: materialCode,
                    flute: bulkImportData.flute,
                    wallType: bulkImportData.wallType,
                    widths: bulkImportData.widths,
                    price: priceVal,
                    moq: moqVal,
                    supplier: bulkImportData.supplier,
                    note: bulkImportData.note,
                    isActive: true, // ค่าเริ่มต้นให้เปิดใช้งานเสมอ
                    createdBy: userEmail || 'System',
                    createdDate: getDateTime(),
                    lastModifiedBy: userEmail || 'System',
                    lastModifiedDate: getDateTime()
                });
            }
        });

        if (newPapers.length === 0) {
            return alert("ไม่พบข้อมูลที่สามารถนำเข้าได้ กรุณาตรวจสอบว่าคัดลอกมาถูกต้อง (แยกคอลัมน์ด้วย Tab)");
        }

        if (!window.confirm(`ระบบพบข้อมูลกระดาษทั้งหมด ${newPapers.length} รายการ\nคุณต้องการบันทึกเข้าระบบใช่หรือไม่?`)) return;

        try {
            // บันทึกลง Firebase ทีละรายการพร้อมกัน
            const promises = newPapers.map(paper => addDoc(collection(db, "paperTypes"), paper));
            const docs = await Promise.all(promises);
            
            // อัปเดตตารางหน้าจอ
            const addedPapers = newPapers.map((p, idx) => ({ id: docs[idx].id, ...p }));
            setPaperTypes(prev => [...prev, ...addedPapers]);
            
            alert(`✅ นำเข้าข้อมูลสำเร็จ ${newPapers.length} รายการ!`);
            setModalMode(null);
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
        }
  };

  const renderBulkImportModal = () => {
        if (modalMode !== 'bulkImportPaper') return null;
        
        return (
            <Modal
                isOpen={true} title="นำเข้ากระดาษหลายรายการ (Bulk Import)" onClose={() => setModalMode(null)} size="lg"
                footer={<><Button variant="secondary" onClick={() => setModalMode(null)}>ยกเลิก</Button> <Button variant="success" icon={Save} onClick={handleProcessBulkImport}>ประมวลผลและบันทึก</Button></>}
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                        <p className="font-bold mb-1">💡 วิธีใช้งาน (แนะนำให้ Copy จาก Excel):</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>จัดเรียงคอลัมน์ตามนี้: <strong>คอลัมน์ 1: ชื่อกระดาษ, คอลัมน์ 2: MOQ, คอลัมน์ 3: ราคา</strong></li>
                            <li>ก๊อปปี้ข้อมูลในตาราง (ไม่ต้องเอาหัวตาราง) มาวางในช่องด้านล่าง</li>
                            <li>ระบบจะดึงรหัสสีจาก 2 ตัวอักษรแรกของชื่อ และประกอบ Global Name ให้อัตโนมัติ</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <InputGroup label="1. ชื่อซัพพลายเออร์ (Supplier) *" value={bulkImportData.supplier} onChange={v => setBulkImportData({...bulkImportData, supplier: v})} required />
                        <InputGroup label="2. ลอนกระดาษ (Flute) *" type="select" options={['A','B','C','E','BC','CE']} value={bulkImportData.flute} onChange={v => setBulkImportData({...bulkImportData, flute: v})} required />
                        <InputGroup label="3. ชั้นผนัง (Wall Type)" type="select" options={['Single Wall','Double Wall']} value={bulkImportData.wallType} onChange={v => setBulkImportData({...bulkImportData, wallType: v})} />
                        <InputGroup label="4. หน้ากว้าง (Widths)" value={bulkImportData.widths} onChange={v => setBulkImportData({...bulkImportData, widths: v})} placeholder="เช่น 48, 60" />
                        <InputGroup label="5. ชื่อต่อท้าย (Suffix)" value={bulkImportData.suffix} onChange={v => setBulkImportData({...bulkImportData, suffix: v})} placeholder="เช่น (Q1/2026)" helpText="จะไปต่อท้ายชื่อ Code Name ทุกรายการ" />
                        <InputGroup label="6. Note (บันทึกช่วยจำ)" value={bulkImportData.note} onChange={v => setBulkImportData({...bulkImportData, note: v})} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">วางข้อมูลตาราง (Paste Data Here) <span className="text-red-500">*</span></label>
                        <textarea 
                            className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm whitespace-pre overflow-auto bg-gray-50"
                            placeholder="KA125/I125&#9;500&#9;15.50&#10;KS170/I125&#9;1000&#9;22.00"
                            value={bulkImportData.rawText}
                            onChange={(e) => setBulkImportData({...bulkImportData, rawText: e.target.value})}
                        ></textarea>
                    </div>
                </div>
            </Modal>
        );
  };
  // 🌟🌟🌟 จบจุดที่ 3 🌟🌟🌟

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ระบบประเมินราคากล่อง (V2.5)</h1>
          <p className="text-gray-500">System Management & Quotation</p>
        </header>

        {renderMainTabs()}
        {renderSubTabs()}

        <main className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* 1. Quotation Tab */}
          {activeMainTab === 'quotation' && renderQuotationScreen()}

          {/* 2. Master Data Tab */}
          {activeMainTab === 'masterData' && (
              <>
                {activeSubTab === 'customer' && renderCustomerTable()}
                {activeSubTab === 'boxStyle' && renderBoxStyleTable()}
                {activeSubTab === 'paper' && renderPaperTable()}
                {activeSubTab === 'printBlock' && renderPrintBlockTable()}
                {activeSubTab === 'printColor' && renderPrintColorTable()}
                {activeSubTab === 'dieCut' && renderDieCutTable()}
              </>
          )}

          {/* 3. App Setting Tab */}
          {/* 3. App Setting Tab */}
          {activeMainTab === 'appSetting' && (
              <div className="space-y-6">
                  {/* ส่วนข้อมูลบริษัท */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                          <div>
                              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Globe size={20}/> ข้อมูลบริษัท (Company Profile)</h2>
                              <p className="text-sm text-gray-500">ข้อมูลนี้จะถูกนำไปใช้ในหัวกระดาษและท้ายกระดาษของใบเสนอราคาทุกใบ</p>
                          </div>
                          {!isEditingCompany ? (
                              <Button variant="primary" icon={Edit} onClick={() => setIsEditingCompany(true)}>แก้ไขข้อมูล</Button>
                          ) : (
                              <div className="flex gap-2">
                                  <Button variant="secondary" onClick={() => { setCompanyData(originalCompanyData); setIsEditingCompany(false); }}>ยกเลิก</Button>
                                  <Button variant="success" icon={Save} onClick={handleSaveCompanyData}>บันทึกข้อมูล</Button>
                              </div>
                          )}
                      </div>

                      <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              {/* ภาษาไทย */}
                              <div className="space-y-4 p-4 bg-blue-50/30 rounded-lg border border-blue-100">
                                  <h3 className="font-semibold text-blue-800 border-b border-blue-200 pb-2">ข้อมูลภาษาไทย (TH)</h3>
                                  <InputGroup label="ชื่อบริษัท" value={companyData.nameTH} onChange={v => setCompanyData({...companyData, nameTH: v})} readOnly={!isEditingCompany} placeholder="บริษัท ตัวอย่าง จำกัด" />
                                  <InputGroup label="ที่อยู่บริษัท" type="textarea" value={companyData.addressTH} onChange={v => setCompanyData({...companyData, addressTH: v})} readOnly={!isEditingCompany} />
                                  <InputGroup label="ชื่อผู้อนุมัติหลัก" value={companyData.approverTH} onChange={v => setCompanyData({...companyData, approverTH: v})} readOnly={!isEditingCompany} placeholder="นาย อนุมัติ งานไว" />
                              </div>

                              {/* English */}
                              <div className="space-y-4 p-4 bg-orange-50/30 rounded-lg border border-orange-100">
                                  <h3 className="font-semibold text-orange-800 border-b border-orange-200 pb-2">English Info (EN)</h3>
                                  <InputGroup label="Company Name" value={companyData.nameEN} onChange={v => setCompanyData({...companyData, nameEN: v})} readOnly={!isEditingCompany} placeholder="Example Co., Ltd." />
                                  <InputGroup label="Company Address" type="textarea" value={companyData.addressEN} onChange={v => setCompanyData({...companyData, addressEN: v})} readOnly={!isEditingCompany} />
                                  <InputGroup label="Main Approver Name" value={companyData.approverEN} onChange={v => setCompanyData({...companyData, approverEN: v})} readOnly={!isEditingCompany} placeholder="Mr. Approve Fast" />
                              </div>

                              {/* ข้อมูลกลาง */}
                              <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                                  <InputGroup label="เลขประจำตัวผู้เสียภาษี (Tax ID)" value={companyData.taxId} onChange={v => setCompanyData({...companyData, taxId: v})} readOnly={!isEditingCompany} />
                                  <InputGroup label="เบอร์โทรศัพท์ (Phone)" value={companyData.phone} onChange={v => setCompanyData({...companyData, phone: v})} readOnly={!isEditingCompany} />
                              </div>

                              {/* ลายเซ็น */}
                              {/* ลายเซ็น & โลโก้ */}
                              <div className="col-span-1 md:col-span-2 mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-4">
                                  
                                  {/* ฝั่งซ้าย: ลายเซ็น */}
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-2">รูปลายเซ็นผู้อนุมัติ (Signature Image)</label>
                                      {isEditingCompany && (
                                          <div className="mb-3"><input type="file" accept="image/*" onChange={handleUploadSignature} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />{isUploadingSig && <span className="text-xs text-blue-500 animate-pulse ml-2">กำลังอัปโหลด...</span>}</div>
                                      )}
                                      {companyData.signatureUrl ? (
                                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 inline-block bg-white shadow-sm hover:border-blue-300 transition-colors">
                                              <img src={companyData.signatureUrl} alt="Signature" className="max-h-24 object-contain" />
                                          </div>
                                      ) : (<div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded border border-dashed">ยังไม่มีรูปภาพลายเซ็น</div>)}
                                  </div>

                                  {/* ฝั่งขวา: โลโก้บริษัท */}
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-2">โลโก้บริษัท (Company Logo)</label>
                                      {isEditingCompany && (
                                          <div className="mb-3"><input type="file" accept="image/*" onChange={handleUploadLogo} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer" />{isUploadingLogo && <span className="text-xs text-orange-500 animate-pulse ml-2">กำลังอัปโหลด...</span>}</div>
                                      )}
                                      {companyData.logoUrl ? (
                                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 inline-block bg-white shadow-sm hover:border-orange-300 transition-colors">
                                              <img src={companyData.logoUrl} alt="Company Logo" className="max-h-24 object-contain" />
                                          </div>
                                      ) : (<div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded border border-dashed">ยังไม่มีรูปภาพโลโก้</div>)}
                                  </div>

                              </div>
                          </div>
                      </div>
                  </div>

                  {/* ส่วนตาราง Audit Log */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                          <AlertCircle size={18} className="text-gray-500"/>
                          <h3 className="font-bold text-gray-800">ประวัติการแก้ไขข้อมูล (Field-Level Audit Log)</h3>
                      </div>
                      <div className="overflow-x-auto max-h-[400px]">
                          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                              <thead className="bg-white sticky top-0 shadow-sm">
                                  <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                      <th className="p-4 border-b">วัน-เวลา (Date/Time)</th>
                                      <th className="p-4 border-b">ผู้แก้ไข (Modified By)</th>
                                      <th className="p-4 border-b">ช่องที่แก้ (Field)</th>
                                      <th className="p-4 border-b">ข้อมูลเดิม (Old Value)</th>
                                      <th className="p-4 border-b">ข้อมูลใหม่ (New Value)</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {(!companyData.auditLogs || companyData.auditLogs.length === 0) ? (
                                      <tr><td colSpan="5" className="p-8 text-center text-gray-400">ยังไม่มีประวัติการแก้ไขข้อมูล</td></tr>
                                  ) : (
                                      companyData.auditLogs.map((log, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50">
                                              <td className="p-4 text-gray-600">{log.modifiedAt}</td>
                                              <td className="p-4 font-medium text-blue-600">{log.modifiedBy}</td>
                                              <td className="p-4 font-semibold text-gray-700">{log.fieldName}</td>
                                              <td className="p-4 text-red-500 max-w-[200px] truncate" title={log.oldValue}><strike>{log.oldValue}</strike></td>
                                              <td className="p-4 text-green-600 max-w-[200px] truncate" title={log.newValue}>{log.newValue}</td>
                                          </tr>
                                      ))
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* 4. Admin Tab */}
          {activeMainTab === 'admin' && renderAdminTable()}

        </main>
      </div>

      {activeMainTab !== 'admin' && renderUnitToggle()}
      {renderConfirmationModal()}
      {renderFormModal()}
      {renderPreviewModal()}
      {/* 🌟 จุดที่ 4: แทรกตรงนี้ครับ เพื่อให้ Modal ถูกเรียกใช้งาน */}
      {renderBulkImportModal()}
    </div>
  );
}