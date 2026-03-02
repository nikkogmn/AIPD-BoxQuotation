import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Copy, Edit, Plus, Save, X, AlertCircle, FileText, User, Box, Grid, Palette, Eye, Ruler, StickyNote, Layers, DollarSign, Truck, ArrowLeftRight, Droplet, Scissors, Shield, Settings, FileInput, Users, Database, Globe, Briefcase, Search, CheckCircle, FilePlus, ChevronLeft, Calculator, Percent, CreditCard, Package } from 'lucide-react';

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc ,setDoc, getDoc } from "firebase/firestore";
// เพิ่มคำสั่งอัปโหลดไฟล์จาก Firebase Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
// อย่าลืมดึง storage มาจากไฟล์ firebase.js ด้วย
import { db, storage } from './firebase';
// --- Constants ---

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
  
   // --- เพิ่ม State สำหรับข้อมูลบริษัท ตรงนี้เลยครับ 👇 ---
  const defaultCompanyState = {
      nameTH: '', nameEN: '',
      addressTH: '', addressEN: '',
      taxId: '', phone: '',
      approverTH: '', approverEN: '',
      signatureUrl: '',
      auditLogs: []
  };
  const [companyData, setCompanyData] = useState(defaultCompanyState);
  const [originalCompanyData, setOriginalCompanyData] = useState(defaultCompanyState);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isUploadingSig, setIsUploadingSig] = useState(false);

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

    // --- เพิ่มฟังก์ชันดึงข้อมูลบริษัท (แบบเจาะจง 1 ไฟล์) 👇 ---
    const fetchCompanyData = async () => {
        try {
            const docSnap = await getDoc(doc(db, "appSettings", "companyProfile"));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCompanyData(data);
                setOriginalCompanyData(data); // เก็บต้นฉบับไว้เทียบตอนแก้
            }
        } catch (error) { console.error("โหลดข้อมูลบริษัทไม่สำเร็จ", error); }
    };

    await Promise.all([
        fetchCollection("customers", setCustomers),
        fetchCollection("boxStyles", setBoxStyles),
        fetchCollection("paperTypes", setPaperTypes),
        fetchCollection("printBlocks", setPrintBlocks),
        fetchCollection("printColors", setPrintColors),
        fetchCollection("dieCutMolds", setDieCutMolds),
        fetchCollection("admins", setAdmins),
        fetchCompanyData() // <--- สั่งดึงข้อมูลตรงนี้
    ]);
  };

  useEffect(() => {
    fetchAllMasterData();
  }, []);
  // 8. Quotations
  const [quotationView, setQuotationView] = useState('list'); 
  const [currentQuot, setCurrentQuot] = useState({
      customerId: '',
      customerName: '',
      boxStyleId: '',
      paperTypeId: '',
      dimW: '',
      dimD: '',
      dimH: '',
      dimG: '3', 
      dimM: '0.5',
      // New fields for calculation
      printType: 'none', // none, 1color, 2color
      printColor1: '',
      printColor2: '',
      printBlocks1: [], // Array of { id, typeId, w, l, price }
      printBlocks2: [],
      printCostPerBox: 0,
      quantity: 1000,
      leadTime: 14,
      shippingType: 'pickup', // pickup, delivery
      shippingCost: 0,
      setupCost: 0,
      profitMargin: 20, // %
      discount: 0, // %
  });

  const [modalMode, setModalMode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isUploading, setIsUploading] = useState(false); // <--- เพิ่มบรรทัดนี้เพื่อทำ Loading รูประหว่างอัปโหลด
  // --- Logic for Blocks ---
  const handleAddBlock = (colorIndex) => {
    const field = colorIndex === 1 ? 'printBlocks1' : 'printBlocks2';
    const currentBlocks = currentQuot[field];
    if (currentBlocks.length >= 30) {
        alert("สูงสุด 30 แบบพิมพ์ต่อสี");
        return;
    }
    const newBlock = { id: Date.now(), typeId: '', w: 0, l: 0, price: 0 };
    setCurrentQuot({ ...currentQuot, [field]: [...currentBlocks, newBlock] });
  };

const handleUpdateBlock = (colorIndex, blockId, field, value) => {
      const stateField = colorIndex === 1 ? 'printBlocks1' : 'printBlocks2';
      const updatedBlocks = currentQuot[stateField].map(b => {
          if (b.id === blockId) {
              const updatedB = { ...b, [field]: value };
              // ถ้ามีการเปลี่ยน ชนิดบล็อค, ความกว้าง หรือ ความยาว ให้คำนวณราคาใหม่
              if (field === 'typeId' || field === 'w' || field === 'l') {
                  const typeId = field === 'typeId' ? value : b.typeId;
                  const w = field === 'w' ? parseFloat(value) || 0 : parseFloat(b.w) || 0;
                  const l = field === 'l' ? parseFloat(value) || 0 : parseFloat(b.l) || 0;
                  
                  const blockType = printBlocks.find(pb => pb.id.toString() === typeId.toString());
                  if (blockType) {
                      // คำนวณ: กว้าง x ยาว (ตารางนิ้ว) * ราคาต่อตารางนิ้วจาก Master Data
                      updatedB.price = (w * l) * parseFloat(blockType.price || 0); 
                  }
              }
              return updatedB;
          }
          return b;
      });
      setCurrentQuot({ ...currentQuot, [stateField]: updatedBlocks });
  };

  const handleRemoveBlock = (colorIndex, blockId) => {
      const field = colorIndex === 1 ? 'printBlocks1' : 'printBlocks2';
      setCurrentQuot({
          ...currentQuot,
          [field]: currentQuot[field].filter(b => b.id !== blockId)
      });
  };

  // --- Calculation Logic ---
  const calculateTotals = () => {
      // 1. Box Cost (คำนวณสูตร Dynamic + แปลงเป็นตารางฟุต)
      const W = parseFloat(currentQuot.dimW) || 0;
      const D = parseFloat(currentQuot.dimD) || 0;
      const H = parseFloat(currentQuot.dimH) || 0;
      const G = parseFloat(currentQuot.dimG) || 0;
      const M = parseFloat(currentQuot.dimM) || 0;
      
      const paper = paperTypes.find(p => p.id.toString() === currentQuot.paperTypeId);
      const selectedBoxStyle = boxStyles.find(b => b.id.toString() === currentQuot.boxStyleId);
      
      let areaSqCm = 0;

      // --- พระเอกของเรา: ประมวลผลสูตรจากข้อความ (Dynamic Formula) ---
      if (selectedBoxStyle && selectedBoxStyle.formula) {
          try {
              // ใช้ Function() เพื่อเปลี่ยนตัวหนังสือสูตร (เช่น "(2*W + 2*D + G) * (H+D)") ให้เป็นคำสั่งคำนวณจริง
              const calcArea = new Function('W', 'D', 'H', 'G', 'M', `return ${selectedBoxStyle.formula};`);
              
              // โยนค่าจากหน้าจอเข้าไปในสมการ
              areaSqCm = calcArea(W, D, H, G, M);
              
              // ป้องกันกรณีสูตรผิดพลาดหรือติดลบ
              if (isNaN(areaSqCm) || areaSqCm < 0) areaSqCm = 0;
          } catch (error) {
              console.error("เกิดข้อผิดพลาดในสูตรคำนวณของรูปแบบกล่อง:", error);
              areaSqCm = 0;
          }
      }
      
      // แปลงจาก ตารางเซนติเมตร เป็น ตารางฟุต (1 ตร.ฟุต = 929.0304 ตร.ซม.)
      const areaSqFt = areaSqCm / 929.0304; 
      
      // ดึงราคาต่อตารางฟุต
      const paperPricePerSqFt = paper ? parseFloat(paper.price) : 0;
      
      // ต้นทุนกระดาษ = พื้นที่(ตร.ฟุต) x ราคา(ต่อ ตร.ฟุต)
      const rawBoxCost = areaSqFt * paperPricePerSqFt; 
      
      const colorCostPerBox = parseFloat(currentQuot.printCostPerBox) || 0;
      const boxCostTotal = rawBoxCost + colorCostPerBox; // A

      // 2. Block Cost
      const blocks1 = currentQuot.printBlocks1.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
      const blocks2 = currentQuot.printBlocks2.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
      const blockCostTotal = blocks1 + blocks2; // B

      // 3. Die Cut (Placeholder)
      const dieCutCost = 0; // C

      // 4. Logistics & Setup
      const shipCost = currentQuot.shippingType === 'delivery' ? (parseFloat(currentQuot.shippingCost) || 0) : 0;
      const setup = parseFloat(currentQuot.setupCost) || 0;
      
      // Total Items Cost (Fixed Costs)
      const totalFixedCosts = blockCostTotal + dieCutCost + setup + shipCost;

      // Total Variable Cost (Per Lot) = (BoxCost * Qty)
      const qty = parseInt(currentQuot.quantity) || 1;
      const totalVariableCost = boxCostTotal * qty;

      const grandTotalCost = totalVariableCost + totalFixedCosts;

      // Profit & Discount
      const profitPercent = parseFloat(currentQuot.profitMargin) || 0;
      const profitAmount = grandTotalCost * (profitPercent / 100);
      const totalWithProfit = grandTotalCost + profitAmount;

      const discountPercent = parseFloat(currentQuot.discount) || 0;
      const discountAmount = totalWithProfit * (discountPercent / 100);
      const totalAfterDiscount = totalWithProfit - discountAmount;

      const vat = totalAfterDiscount * 0.07;
      const netTotal = totalAfterDiscount + vat;

      const pricePerBox = totalAfterDiscount / qty;

      return {
          boxCostA: boxCostTotal,
          colorCostDetail: colorCostPerBox,
          blockCostB: blockCostTotal,
          blocks1Detail: currentQuot.printBlocks1,
          blocks2Detail: currentQuot.printBlocks2,
          dieCutC: dieCutCost,
          shipCost,
          setupCost: setup,
          grandTotalCost,
          totalWithProfit,
          totalAfterDiscount,
          netTotal,
          pricePerBox
      };
  };

  const totals = useMemo(() => calculateTotals(), [currentQuot, paperTypes]);


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
  const handleUploadSignature = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsUploadingSig(true);
      try {
          const storageRef = ref(storage, `signatures/sig_${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          setCompanyData(prev => ({ ...prev, signatureUrl: url }));
      } catch (error) { alert("อัปโหลดลายเซ็นไม่สำเร็จ"); }
      finally { setIsUploadingSig(false); }
  };

const handleSaveCompanyData = async () => {
      try {
          const newLogs = [];
          const fieldsToTrack = [
              { key: 'nameTH', label: 'ชื่อบริษัท (TH)' }, { key: 'nameEN', label: 'ชื่อบริษัท (EN)' },
              { key: 'addressTH', label: 'ที่อยู่ (TH)' }, { key: 'addressEN', label: 'ที่อยู่ (EN)' },
              { key: 'taxId', label: 'เลขประจำตัวผู้เสียภาษี' }, { key: 'phone', label: 'เบอร์โทรศัพท์' },
              { key: 'approverTH', label: 'ผู้อนุมัติ (TH)' }, { key: 'approverEN', label: 'ผู้อนุมัติ (EN)' },
              { key: 'signatureUrl', label: 'รูปลายเซ็น' }
          ];

          fieldsToTrack.forEach(field => {
              const oldVal = originalCompanyData[field.key] || '';
              const newVal = companyData[field.key] || '';
              
              if (oldVal !== newVal) {
                  newLogs.push({
                      fieldName: field.label,
                      oldValue: oldVal || '-',
                      newValue: newVal || '-',
                      modifiedBy: userEmail || 'Admin', // ป้องกัน Error หากดึง Email ไม่มา
                      modifiedAt: getDateTime()
                  });
              }
          });

          const updatedLogs = newLogs.length > 0 
              ? [...newLogs, ...(originalCompanyData.auditLogs || [])] 
              : (originalCompanyData.auditLogs || []);

          // แพ็คข้อมูลใหม่ทั้งหมด (ถ้าช่องไหนไม่ได้กรอก ให้เป็นค่าว่าง '' แทน undefined)
          const finalDataToSave = { 
              nameTH: companyData.nameTH || '', 
              nameEN: companyData.nameEN || '',
              addressTH: companyData.addressTH || '', 
              addressEN: companyData.addressEN || '',
              taxId: companyData.taxId || '', 
              phone: companyData.phone || '',
              approverTH: companyData.approverTH || '', 
              approverEN: companyData.approverEN || '',
              signatureUrl: companyData.signatureUrl || '',
              auditLogs: updatedLogs 
          };

          // บันทึกทับลงไปใน Document เดิม
          await setDoc(doc(db, "appSettings", "companyProfile"), finalDataToSave, { merge: true });
          
          setOriginalCompanyData(finalDataToSave);
          setCompanyData(finalDataToSave);
          setIsEditingCompany(false);
          alert("บันทึกข้อมูลบริษัทและเก็บประวัติการแก้ไขเรียบร้อยแล้ว");
          
      } catch (error) {
          console.error("Save Company Error:", error);
          // อัปเดตให้แจ้งเตือนบอกด้วยว่า Error จากอะไร จะได้หาเป้าเจอครับ
          alert("บันทึกข้อมูลไม่สำเร็จ: " + error.message); 
      }
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
        <Button variant="primary" icon={Plus} onClick={handleCreateClick}>เพิ่มรายการ</Button>
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
                      <div className="text-xs text-gray-400 font-normal">{item.globalName}</div>
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

  // NEW: Quotation Screen
  const renderQuotationScreen = () => {
    // List View
    if (quotationView === 'list') {
        return (
            <div className="space-y-6">
                 {/* Dashboard Stats */}
                 <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                         <div>
                             <p className="text-sm text-gray-500 mb-1">ใบเสนอราคาเดือนนี้</p>
                             <h3 className="text-2xl font-bold text-gray-800">12 ใบ</h3>
                         </div>
                         <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                             <FileText size={24} />
                         </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
                         <div>
                             <p className="text-sm text-gray-500 mb-1">ยอดอนุมัติแล้ว</p>
                             <h3 className="text-2xl font-bold text-gray-800">5 ใบ</h3>
                         </div>
                         <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                             <CheckCircle size={24} />
                         </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group" onClick={() => setQuotationView('create')}>
                         <div className="text-center">
                             <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2 shadow-md group-hover:scale-110 transition-transform">
                                 <Plus size={24} />
                             </div>
                             <h3 className="font-semibold text-blue-600">สร้างใบเสนอราคาใหม่</h3>
                         </div>
                    </div>
                 </div>

                 {/* Recent List */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-bold text-gray-800">รายการล่าสุด</h3>
                    </div>
                    <div className="p-8 text-center text-gray-400">
                        ยังไม่มีข้อมูลใบเสนอราคา
                    </div>
                 </div>
            </div>
        );
    } 
    
    // Create/Edit View
    else {
        const selectedBoxStyle = boxStyles.find(b => b.id.toString() === currentQuot.boxStyleId);

        // Helper to render Print Config
        const renderPrintConfig = (index) => {
             const colorField = index === 1 ? 'printColor1' : 'printColor2';
             const blocksField = index === 1 ? 'printBlocks1' : 'printBlocks2';
             const blocks = currentQuot[blocksField];

             return (
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 animate-in fade-in slide-in-from-top-2">
                     <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                         <Droplet size={16} className={index === 1 ? "text-cyan-500" : "text-magenta-500"}/>
                         พิมพ์สีที่ {index}
                     </h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <InputGroup 
                            label="1.1.1 เลือกสี (Master Data)" 
                            type="select"
                            options={printColors.map(c => ({label: `${c.codeName} - ${c.globalName}`, value: c.id}))}
                            value={currentQuot[colorField]}
                            onChange={(v) => setCurrentQuot({...currentQuot, [colorField]: v})}
                         />
                         <div className="flex items-end mb-4">
                            <Button variant="outline" icon={Plus} onClick={() => handleAddBlock(index)} className="w-full">
                                1.1.2 เพิ่มแบบพิมพ์ (Max 30)
                            </Button>
                         </div>
                     </div>

                     {/* Blocks List */}
                     {blocks.length > 0 && (
                         <div className="space-y-3">
                             {blocks.map((block, idx) => (
                                 <div key={block.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm relative">
                                     <button onClick={() => handleRemoveBlock(index, block.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={16}/></button>
                                     <div className="grid grid-cols-12 gap-2 items-end">
                                         <div className="col-span-4">
                                             <label className="text-xs font-semibold text-gray-500">เลือกแบบพิมพ์</label>
                                             <select 
                                                className="w-full p-1.5 border border-gray-300 rounded text-sm"
                                                value={block.typeId}
                                                onChange={(e) => handleUpdateBlock(index, block.id, 'typeId', e.target.value)}
                                             >
                                                 <option value="">-- เลือก --</option>
                                                 {printBlocks.map(pb => (
                                                     <option key={pb.id} value={pb.id}>{pb.codeName}</option>
                                                 ))}
                                             </select>
                                         </div>
                                         <div className="col-span-3">
                                             <label className="text-xs font-semibold text-gray-500">กว้าง x ยาว ({currentUnit})</label>
                                             <div className="flex gap-1">
                                                 <input type="number" className="w-full p-1.5 border rounded text-sm" placeholder="W" value={block.w} onChange={(e) => handleUpdateBlock(index, block.id, 'w', e.target.value)} />
                                                 <input type="number" className="w-full p-1.5 border rounded text-sm" placeholder="L" value={block.l} onChange={(e) => handleUpdateBlock(index, block.id, 'l', e.target.value)} />
                                             </div>
                                         </div>
                                         <div className="col-span-2">
                                              <label className="text-xs font-semibold text-gray-500 text-right block">ราคา</label>
                                              <div className="p-1.5 bg-gray-100 rounded text-sm text-right font-medium">
                                                  {block.price.toFixed(2)}
                                              </div>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             );
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setQuotationView('list')} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
                            <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">สร้างใบเสนอราคาใหม่</h2>
                            <p className="text-xs text-gray-500">New Quotation Draft</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" icon={Save}>บันทึกร่าง</Button>
                        <Button variant="primary" icon={CheckCircle}>ยืนยันใบเสนอราคา</Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: INPUTS */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 1. Customer Selection */}
                        <div className="border rounded-lg p-5 border-blue-100 bg-blue-50/20">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <User size={18} className="text-blue-600"/> 
                                    1. ข้อมูลลูกค้า (Customer Information)
                                </h3>
                                <Button variant="outline" icon={Plus} className="!py-1.5 !px-3 text-sm" onClick={handleCreateCustomerFromQuotation}>
                                    สร้างลูกค้าใหม่
                                </Button>
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
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} - {c.company}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-span-1 p-3 bg-white rounded border text-sm text-gray-600">
                                     {currentQuot.customerName ? <span className="font-semibold text-blue-600">{currentQuot.customerName}</span> : 'ยังไม่ได้เลือกลูกค้า'}
                                </div>
                            </div>
                        </div>

                        {/* 2. Box Specification */}
                        <div className="border rounded-lg p-5 border-gray-200 bg-white shadow-sm">
                            <div className="mb-6 pb-2 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Box size={18} className="text-orange-500"/> 
                                    2. ข้อมูลสินค้า (Product Specification)
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <InputGroup 
                                        label="เลือกรูปแบบกล่อง (Box Style)" 
                                        type="select" 
                                        required
                                        options={boxStyles.map(b => ({label: `${b.codeName} - ${b.globalName}`, value: b.id}))}
                                        value={currentQuot.boxStyleId}
                                        onChange={(v) => setCurrentQuot({...currentQuot, boxStyleId: v})}
                                    />

                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                        <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-1">
                                            <Ruler size={14}/> ระบุขนาดกล่อง (Dimensions - cm)
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <InputGroup label="W" type="number" min="0" placeholder="0" value={currentQuot.dimW} onChange={(v) => setCurrentQuot({...currentQuot, dimW: v})} />
                                            <InputGroup label="D" type="number" min="0" placeholder="0" value={currentQuot.dimD} onChange={(v) => setCurrentQuot({...currentQuot, dimD: v})} />
                                            <InputGroup label="H" type="number" min="0" placeholder="0" value={currentQuot.dimH} onChange={(v) => setCurrentQuot({...currentQuot, dimH: v})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <InputGroup label="G (กาว)" type="number" min="0" placeholder="3" value={currentQuot.dimG} onChange={(v) => setCurrentQuot({...currentQuot, dimG: v})} />
                                            <InputGroup label="M (พับ)" type="number" min="0" placeholder="0.5" value={currentQuot.dimM} onChange={(v) => setCurrentQuot({...currentQuot, dimM: v})} />
                                        </div>
                                    </div>

                                <InputGroup 
                                        label="เลือกเกรดกระดาษ (Paper Type)" 
                                        type="select" 
                                        required
                                        /* เปลี่ยนคำลงท้ายให้ชัดเจนว่าเป็น ฿/ตร.ฟุต */
                                        options={paperTypes.map(p => ({label: `${p.codeName} (${p.flute}-Flute) - ${p.price} ฿/ตร.ฟุต`, value: p.id}))}
                                        value={currentQuot.paperTypeId}
                                        onChange={(v) => setCurrentQuot({...currentQuot, paperTypeId: v})}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center p-2 min-h-[300px]">
                                        {selectedBoxStyle ? (
                                            selectedBoxStyle.baseType === 'OTHER' ? (
                                                selectedBoxStyle.imageUrl ? (
                                                    <img src={selectedBoxStyle.imageUrl} alt="Box Preview" className="max-h-[300px] object-contain rounded" />
                                                ) : (
                                                    <div className="text-center text-gray-400">
                                                        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">กล่องรูปแบบพิเศษ (ไม่มีภาพประกอบ)</p>
                                                    </div>
                                                )
                                            ) : (
                                                <BoxSchematic 
                                                    baseType={selectedBoxStyle.baseType} 
                                                    codeName={selectedBoxStyle.codeName} 
                                                    globalName={selectedBoxStyle.globalName} 
                                                    dimensions={{ W: currentQuot.dimW, D: currentQuot.dimD, H: currentQuot.dimH, G: currentQuot.dimG, M: currentQuot.dimM }}
                                                />
                                            )
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <Box size={32} className="mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">เลือกรูปแบบกล่องเพื่อดูแบบ</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Printing Options (UPDATED) */}
                        <div className="border rounded-lg p-5 border-gray-200 bg-white shadow-sm">
                            <div className="mb-6 pb-2 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Palette size={18} className="text-purple-500"/> 
                                    3. การพิมพ์ (Printing Options)
                                </h3>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">1. เลือกการพิมพ์</label>
                                <div className="flex gap-4">
                                    {['none', '1color', '2colors'].map(type => (
                                        <label key={type} className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all
                                            ${currentQuot.printType === type ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                        `}>
                                            <input 
                                                type="radio" 
                                                name="printType" 
                                                className="w-4 h-4 text-purple-600"
                                                checked={currentQuot.printType === type}
                                                onChange={() => setCurrentQuot({...currentQuot, printType: type})}
                                            />
                                            {type === 'none' ? 'ไม่พิมพ์' : type === '1color' ? 'พิมพ์ 1 สี' : 'พิมพ์ 2 สี'}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {currentQuot.printType !== 'none' && (
                                <div className="space-y-6">
                                    {renderPrintConfig(1)}
                                    {currentQuot.printType === '2colors' && renderPrintConfig(2)}
                                    
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <InputGroup 
                                            label="1.2 ค่าสีต่อกล่อง (Color Cost per Box)" 
                                            type="number" 
                                            placeholder="0.00" 
                                            suffix="฿/กล่อง"
                                            value={currentQuot.printCostPerBox}
                                            onChange={(v) => setCurrentQuot({...currentQuot, printCostPerBox: v})}
                                            helpText="ใส่ค่าใช้จ่ายเฉลี่ยของสีที่ใช้ต่อใบ"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Quantity & Logistics (UPDATED) */}
                        <div className="border rounded-lg p-5 border-gray-200 bg-white shadow-sm">
                             <div className="mb-6 pb-2 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Package size={18} className="text-green-500"/> 
                                    4. การผลิตและขนส่ง (Production & Logistics)
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup 
                                    label="2. จำนวนผลิต (Quantity)" 
                                    type="number" 
                                    value={currentQuot.quantity}
                                    onChange={(v) => setCurrentQuot({...currentQuot, quantity: v})}
                                    suffix="ใบ"
                                />
                                <InputGroup 
                                    label="3. คาดการณ์วันรับสินค้า (Lead Time)" 
                                    type="number" 
                                    value={currentQuot.leadTime}
                                    onChange={(v) => setCurrentQuot({...currentQuot, leadTime: v})}
                                    suffix="วัน"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">4.1 การขนส่ง (Shipping)</label>
                                    <div className="flex gap-4 mb-2">
                                         <label className="flex items-center gap-2 cursor-pointer">
                                             <input type="radio" name="shipType" checked={currentQuot.shippingType === 'pickup'} onChange={() => setCurrentQuot({...currentQuot, shippingType: 'pickup'})}/>
                                             ลูกค้ามารับเอง
                                         </label>
                                         <label className="flex items-center gap-2 cursor-pointer">
                                             <input type="radio" name="shipType" checked={currentQuot.shippingType === 'delivery'} onChange={() => setCurrentQuot({...currentQuot, shippingType: 'delivery'})}/>
                                             จัดส่งให้
                                         </label>
                                    </div>
                                    {currentQuot.shippingType === 'delivery' && (
                                        <InputGroup 
                                            placeholder="ค่าขนส่ง (เหมา)" 
                                            type="number"
                                            value={currentQuot.shippingCost}
                                            onChange={(v) => setCurrentQuot({...currentQuot, shippingCost: v})}
                                        />
                                    )}
                                </div>
                                <InputGroup 
                                    label="4.2 ค่าเปิดคำสั่งซื้อ/Setup (Setup Cost)" 
                                    type="number" 
                                    placeholder="0.00"
                                    value={currentQuot.setupCost}
                                    onChange={(v) => setCurrentQuot({...currentQuot, setupCost: v})}
                                    helpText="เช่น ค่าเพลท, ค่าบล็อคมีด (ถ้าคิดแยก)"
                                />
                            </div>
                        </div>

                        {/* 5. Financials (UPDATED) */}
                        <div className="border rounded-lg p-5 border-gray-200 bg-white shadow-sm">
                             <div className="mb-6 pb-2 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <DollarSign size={18} className="text-emerald-500"/> 
                                    5. การเงิน (Financials)
                                </h3>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup 
                                    label="5. อัตรากำไร (Profit Margin)" 
                                    type="number" 
                                    value={currentQuot.profitMargin}
                                    onChange={(v) => setCurrentQuot({...currentQuot, profitMargin: v})}
                                    suffix="%"
                                />
                                <InputGroup 
                                    label="6. ส่วนลด (Discount)" 
                                    type="number" 
                                    value={currentQuot.discount}
                                    onChange={(v) => setCurrentQuot({...currentQuot, discount: v})}
                                    suffix="%"
                                />
                             </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: SUMMARY (Sticky) */}
                    <div className="lg:col-span-1">
                         <div className="sticky top-24 space-y-4">
                             {/* Pricing Summary Card */}
                             <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                                 <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white text-center">
                                     <h3 className="text-sm font-medium opacity-80 mb-1">ราคาขายต่อกล่อง (Unit Price)</h3>
                                     <div className="text-4xl font-bold flex items-center justify-center gap-1">
                                         {totals.pricePerBox.toFixed(2)}
                                         <span className="text-lg font-normal opacity-70">฿</span>
                                     </div>
                                 </div>
                                 <div className="p-6 space-y-4">
                                     <h4 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                                        <Calculator size={16}/> สรุปรายการ (Summary)
                                     </h4>
                                     
                                     {/* Breakdown Details */}
                                     <div className="space-y-3 text-sm">
                                         
                                         {/* A: Box Cost */}
                                         <div className="flex justify-between items-start">
                                             <div className="text-gray-600">
                                                 <span className="font-semibold text-gray-800 block">A. กล่อง (Box)</span>
                                                 <span className="text-xs text-gray-400 pl-2 block">- ค่าสีต่อกล่อง ({totals.colorCostDetail.toFixed(2)})</span>
                                             </div>
                                             <div className="font-medium">{(totals.boxCostA * currentQuot.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</div>
                                         </div>

                                         {/* B: Block Cost */}
                                         <div className="flex justify-between items-start">
                                             <div className="text-gray-600">
                                                 <span className="font-semibold text-gray-800 block">B. ค่าบล็อค (Blocks)</span>
                                                 {totals.blocks1Detail.map((b,i) => (
                                                     <span key={`1-${i}`} className="text-xs text-gray-400 pl-2 block">- สี 1: {b.price.toFixed(2)}</span>
                                                 ))}
                                                  {totals.blocks2Detail.map((b,i) => (
                                                     <span key={`2-${i}`} className="text-xs text-gray-400 pl-2 block">- สี 2: {b.price.toFixed(2)}</span>
                                                 ))}
                                             </div>
                                             <div className="font-medium">{totals.blockCostB.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</div>
                                         </div>

                                         {/* C: Die Cut Cost */}
                                         <div className="flex justify-between">
                                             <div className="text-gray-600"><span className="font-semibold text-gray-800">C. ค่าใบมีด (Die Cut)</span></div>
                                             <div className="font-medium">{totals.dieCutC.toFixed(2)} ฿</div>
                                         </div>

                                         {/* Other Costs */}
                                          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-dashed">
                                             <div>ค่าขนส่ง</div>
                                             <div>{totals.shipCost.toFixed(2)} ฿</div>
                                         </div>
                                         <div className="flex justify-between text-xs text-gray-500">
                                             <div>ค่า Setup</div>
                                             <div>{totals.setupCost.toFixed(2)} ฿</div>
                                         </div>

                                     </div>

                                     {/* Totals Calculation */}
                                     <div className="pt-4 border-t border-gray-200 space-y-2">
                                         <div className="flex justify-between text-sm text-gray-600">
                                             <span>รวมต้นทุน (A+B+C+Others)</span>
                                             <span>{totals.grandTotalCost.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                         </div>
                                         <div className="flex justify-between text-sm text-green-600">
                                             <span>+ กำไร ({currentQuot.profitMargin}%)</span>
                                             <span>{(totals.totalWithProfit - totals.grandTotalCost).toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                         </div>
                                         <div className="flex justify-between text-sm text-red-500">
                                             <span>- ส่วนลด ({currentQuot.discount}%)</span>
                                             <span>{(totals.totalWithProfit - totals.totalAfterDiscount).toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                         </div>
                                          <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t">
                                             <span>ยอดสุทธิ (ก่อน VAT)</span>
                                             <span>{totals.totalAfterDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                         </div>
                                         <div className="flex justify-between text-sm text-gray-500">
                                             <span>VAT 7%</span>
                                             <span>{(totals.netTotal - totals.totalAfterDiscount).toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                         </div>
                                         <div className="bg-gray-800 text-white p-3 rounded-lg flex justify-between items-center mt-2">
                                             <span className="font-bold">Grand Total</span>
                                             <span className="font-bold text-lg">{totals.netTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             
                             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
                                 <p className="font-semibold mb-1">หมายเหตุ:</p>
                                 <ul className="list-disc pl-4 space-y-1">
                                     <li>ราคานี้คำนวณเบื้องต้นจากสูตรมาตรฐาน</li>
                                     <li>ราคาบล็อคคำนวณตาม Master Data</li>
                                     <li>กรุณาตรวจสอบสต็อกกระดาษก่อนยืนยัน</li>
                                 </ul>
                             </div>
                         </div>
                    </div>

                </div>
            </div>
        )
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
    }  else if (activeSubTab === 'paper') {
        formContent = (
            <>
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
            title={`Preview Diagram: ${selectedItem.codeName}`}
            onClose={() => setModalMode(null)}
            size="lg"
            footer={<Button variant="secondary" onClick={() => setModalMode(null)}>ปิดหน้าต่าง</Button>}
        >
            <div className="flex flex-col gap-4">
                <div className="text-center mb-2">
                    <h4 className="text-xl font-bold text-gray-800">{selectedItem.globalName}</h4>
                    <p className="text-gray-500">แบบจำลองโครงสร้างกล่องและตำแหน่งตัวแปร</p>
                </div>
                <BoxSchematic codeName={selectedItem.codeName} globalName={selectedItem.globalName} />
                {selectedItem.imageUrl && (
                    <div className="mt-4 border-t pt-4 text-center">
                         <img src={selectedItem.imageUrl} alt="Reference" className="max-h-64 object-contain inline-block border rounded p-2" />
                    </div>
                )}
                {selectedItem.note && (
                   <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex gap-2 items-start">
                      <StickyNote size={18} className="mt-0.5 shrink-0" />
                      <div><span className="font-semibold block mb-1">Note:</span>{selectedItem.note}</div>
                   </div>
                )}
            </div>
        </Modal>
    );
  };

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
                              <div className="col-span-1 md:col-span-2 mt-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">รูปลายเซ็นผู้อนุมัติ (Signature Image)</label>
                                  {isEditingCompany && (
                                      <div className="mb-3">
                                          <input type="file" accept="image/*" onChange={handleUploadSignature} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                                          {isUploadingSig && <span className="text-xs text-blue-500 animate-pulse ml-2">กำลังอัปโหลด...</span>}
                                      </div>
                                  )}
                                  {companyData.signatureUrl ? (
                                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 inline-block bg-white">
                                          <img src={companyData.signatureUrl} alt="Signature" className="max-h-24 object-contain" />
                                      </div>
                                  ) : (
                                      <div className="text-sm text-gray-400 italic">ยังไม่มีรูปภาพลายเซ็น</div>
                                  )}
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
    </div>
  );
}