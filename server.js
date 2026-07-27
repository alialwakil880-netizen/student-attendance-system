const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

console.log('🚀 نظام حضور وغياب الطلاب');
console.log('📌 استخدم admin/123 أو secretary/123 للدخول');

app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
    console.log('📊 البيانات محفوظة في localStorage حالياً');
    console.log('🔗 للاتصال بـ Google Sheets اتبع التعليمات');
});