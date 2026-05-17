module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { token, path, fileBase64 } = req.body;

    if (!token || !path || !fileBase64) {
      return res.status(400).json({ error: 'חסרים נתונים' });
    }

    // זו ה"תחפושת" שלנו - גורם לשרת להיראות כמו דפדפן כרום רגיל
    const fakeHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    };

    // בדיקת התחברות עם התחפושת
    const checkRes = await fetch(`https://www.yemot.co.il/ym/api/GetIVR2Dir?token=${token}&path=${path.split('/')[0]}`, {
        headers: fakeHeaders
    });
    const checkText = await checkRes.text();
    
    if (checkText.includes('<html') || checkText.includes('<!DOCTYPE')) {
        return res.status(502).json({ 
            error: "חסימה קשיחה: בימות המשיח חוסמים לחלוטין את כתובות ה-IP של Vercel, גם עם תחפושת דפדפן.",
            details: checkText.substring(0, 100) 
        });
    }

    // אם עברנו את חומת האש, נכין את הקובץ
    const buffer = Buffer.from(fileBase64, 'base64');
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('token', token);
    formData.append('path', path);
    formData.append('file', blob, 'audio.wav');

    // שולחים את ההעלאה עם התחפושת (fetch יודע לטפל ב-Content-Type של FormData אוטומטית)
    const response = await fetch('https://www.yemot.co.il/ym/api/UploadFile', {
      method: 'POST',
      headers: fakeHeaders,
      body: formData
    });

    const textResponse = await response.text();

    try {
        const data = JSON.parse(textResponse);
        return res.status(200).json(data);
    } catch(e) {
        return res.status(502).json({
            error: "השרת של בימות המשיח דחה את ההעלאה. התשובה שלהם: " + textResponse.substring(0, 50) + "..."
        });
    }

  } catch (error) {
    return res.status(500).json({ error: "שגיאת Vercel פנימית: " + error.message });
  }
};
