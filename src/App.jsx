// src/App.jsx
import React, { useState, useEffect } from 'react';
import { auth, provider, db } from './firebase'; // <--- ดึง db มาใช้
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'; // <--- ชุดคำสั่ง Firestore
import MainApp from './MainApp';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // ตัวแปรเก็บระดับสิทธิ์
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // ฟังก์ชันเช็คอีเมลจาก Database (แทนการใช้ Array แบบเดิม)
  const checkWhitelist = async (currentUser) => {
    try {
        const currentEmail = currentUser.email.toLowerCase();
        const adminsRef = collection(db, "admins");
        
        // 1. เช็คก่อนว่าในฐานข้อมูลมีแอดมินหรือยัง (เผื่อเพิ่งสร้างระบบใหม่)
        // 1. เช็คก่อนว่าในฐานข้อมูลมีแอดมินหรือยัง
        const allAdmins = await getDocs(adminsRef);
        if (allAdmins.empty) {
            
            // --- ป้องกันความปลอดภัย: อนุญาตเฉพาะอีเมลเจ้าของแอปเท่านั้น ---
            const ownerEmail = "natdanai.n68@gmail.com"; // << เปลี่ยนเป็น Gmail ของคุณเอง
            
            if (currentEmail === ownerEmail) {
                // ถ้าเป็นเจ้าของตัวจริง ถึงจะยอมสร้างประวัติให้
                await addDoc(adminsRef, {
                    email: currentEmail,
                    tier: 'Level 1',
                    note: 'ผู้ก่อตั้งระบบ (System Auto-generated)',
                    createdBy: 'System',
                    createdDate: new Date().toISOString(),
                    lastModifiedBy: 'System',
                    lastModifiedDate: new Date().toISOString()
                });
                setUserRole('Level 1');
                setUser(currentUser);
                setErrorMsg('');
            } else {
                // ถ้าตารางว่าง แต่คนล็อกอินไม่ใช่อีเมลเจ้าของ ให้เตะออกทันที
                await signOut(auth);
                setUser(null);
                setUserRole(null);
                setErrorMsg("ระบบยังไม่เปิดใช้งาน (รอผู้ก่อตั้งระบบตั้งค่าขั้นต้น)");
            }
            return;
        }

        // 2. ถ้ามีข้อมูลแล้ว ให้ค้นหาอีเมลคนที่กำลัง Login
        const q = query(adminsRef, where("email", "==", currentEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // เจอข้อมูล -> ให้เข้าสู่ระบบและเก็บระดับสิทธิ์ไว้
            const adminData = querySnapshot.docs[0].data();
            setUserRole(adminData.tier);
            setUser(currentUser);
            setErrorMsg('');
        } else {
            // ไม่เจอ -> เตะออก
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setErrorMsg(`ปฏิเสธการเข้าถึง: อีเมล ${currentEmail} ไม่มีข้อมูลในระบบจัดการสิทธิ์ (Admin)`);
        }
    } catch (error) {
        console.error("Error checking whitelist:", error);
        setErrorMsg("เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูลสิทธิ์");
        await signOut(auth);
        setUser(null);
    }
  };

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await checkWhitelist(currentUser);
      } else {
        setUser(null);
      }
      setIsChecking(false);
    });
    
    return () => unsubscribe();
  }, []);

const handleLogin = async () => {
    try {
      setErrorMsg('');
      setIsChecking(true);
      // เปลี่ยนมาใช้ Popup แทน
      await signInWithPopup(auth, provider); 
      // ❌ ลบบรรทัด await checkWhitelist(result.user); ตรงนี้ทิ้งไปเลยครับ 
    } catch (error) {
      console.error("Login failed", error);
      setErrorMsg("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
      setIsChecking(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 font-medium animate-pulse">กำลังตรวจสอบข้อมูลความปลอดภัย...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">ระบบประเมินราคากล่อง</h1>
          <p className="text-gray-500 mb-6">เฉพาะผู้ใช้งานที่มีสิทธิ์ในระบบเท่านั้น</p>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-left flex items-start gap-2 break-words">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white p-4 shadow-sm flex justify-between items-center px-8 border-b">
         <span className="text-gray-600">ยินดีต้อนรับ: <span className="font-semibold text-blue-600">{user.email}</span> <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{userRole}</span></span>
         <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-medium transition">
            ออกจากระบบ (Logout)
         </button>
      </div>
      {/* โยนสิทธิ์ของ User ไปให้ MainApp จัดการการแสดงผล */}
      <MainApp userRole={userRole} userEmail={user.email} /> 
    </div>
  );
}