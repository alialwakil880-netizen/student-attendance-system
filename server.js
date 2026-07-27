const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('.'));

app.listen(port, '0.0.0.0', () => {
    console.log('\n✅ السيرفر شغال!');
    console.log('📱 افتح على التلفون: http://192.168.1.5:3000');
    console.log('💻 افتح على الكمبيوتر: http://localhost:3000');
    console.log('🔴 اضغط Ctrl+C للإيقاف\n');
});
