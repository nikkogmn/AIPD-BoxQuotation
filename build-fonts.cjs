// build-fonts.cjs
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'public', 'fonts');
const outputFile = path.join(__dirname, 'src', 'services', 'vfs_fonts.js');

const fontMap = {
    'THSarabunNew.ttf': 'thai-regular',
    'THSarabunNew-Bold.ttf': 'thai-bold',
    'THSarabunNew-Italic.ttf': 'thai-italic',
    'THSarabunNew-BoldItalic.ttf': 'thai-bolditalic'
};

const vfs = {};
const files = fs.readdirSync(fontsDir);

files.forEach(file => {
    if (fontMap[file]) {
        const filePath = path.join(fontsDir, file);
        const base64 = fs.readFileSync(filePath).toString('base64');
        vfs[fontMap[file]] = base64;
    }
});

// 🌟 ปรับตรงนี้: ให้ Export เป็น Object ธรรมดาที่ไม่มีคำว่า default ซ้อน
const jsContent = `export default ${JSON.stringify(vfs)};`;

fs.writeFileSync(outputFile, jsContent);
console.log("✅ สร้าง vfs_fonts.js เรียบร้อย");