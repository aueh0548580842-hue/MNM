module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { token, path, fileBase64 } = req.body;

    // בדיקה: ננסה קודם לקבל את רשימת הקבצים בשלוחה כדי לראות אם הטוקן עובד
    // זה מוודא שהחיבור בין Vercel לבימות המשיח תקין
    const checkRes = await fetch(`https://www.yemot.co.il/ym/api/GetIVR2Dir?token=${token}&path=${path.split('/')[0]}`);
    const checkText = await checkRes.text();
    
    if (checkText.includes('<html')) {
        return res.status(502).json({ 
            error: "השרת של בימות המשיח חוסם את Vercel. הוא מחזיר דף אינטרנט במקום נתונים.",
            details: "WAF Block suspected" 
        });
    }

    // אם הבדיקה עברה, ננסה להעלות את הקובץ
    const buffer = Buffer.from(fileBase64, 'base64');
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('token', token);
    formData.append('path', path);
    formData.append('file', blob, 'audio.wav');

    const response = await fetch('https://www.yemot.co.il/ym/api/UploadFile', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "שגיאת תקשורת: " + error.message });
  }
};
