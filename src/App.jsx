// src/App.jsx
import React, { useState, useEffect } from 'react';
import { auth, provider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import MainApp from './MainApp';

// 1. ใส่รายชื่ออีเมลของคุณตรงนี้ (พิมพ์เล็กหรือใหญ่ก็ได้ ระบบจะจัดการให้)
const ALLOWED_EMAILS = [
  'natdanai.n68@gmail.com', // <--- ใส่ของคุณตรงนี้นะครับ
  'malee.srithongkul@gmail.com'
];

export default function App() {
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    try {
      setErrorMsg(''); 
      const result = await signInWithPopup(auth, provider);
      
      // ดึงอีเมลมาแปลงเป็นตัวพิมพ์เล็กทั้งหมดเพื่อป้องกันข้อผิดพลาด
      const loggedInEmail = result.user.email.toLowerCase();
      const allowedList = ALLOWED_EMAILS.map(email => email.toLowerCase());

      if (!allowedList.includes(loggedInEmail)) {
         await signOut(auth); 
         setErrorMsg(`ปฏิเสธการเข้าถึง: อีเมล ${result.user.email} ไม่มีสิทธิ์เข้าใช้งานระบบ`);
         setUser(null);
      } else {
         // ถ้าผ่านระบบตรวจสอบ ให้สั่งเปลี่ยนหน้าจอเข้าสู่ MainApp ทันที
         setUser(result.user);
      }
    } catch (error) {
      console.error("Login failed", error);
      // กรณีปิด popup ไปเอง จะได้ไม่ค้าง
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const currentEmail = currentUser.email.toLowerCase();
        const allowedList = ALLOWED_EMAILS.map(email => email.toLowerCase());

        if (allowedList.includes(currentEmail)) {
          setUser(currentUser); 
        } else {
          signOut(auth); 
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">ระบบประเมินราคากล่อง</h1>
          <p className="text-gray-500 mb-6">เฉพาะผู้ใช้งานที่ได้รับอนุมัติเท่านั้น</p>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-left flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
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
         <span className="text-gray-600">ยินดีต้อนรับ: <span className="font-semibold text-blue-600">{user.email}</span></span>
         <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-medium">
            ออกจากระบบ (Logout)
         </button>
      </div>
      <MainApp />
    </div>
  );
}