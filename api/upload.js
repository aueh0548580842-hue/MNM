module.exports = async function handler(req, res) {
  // מוודאים שהבקשה היא מסוג POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { token, path, fileBase64 } = req.body;

    if (!token || !path || !fileBase64) {
      return res.status(400).json({ error: 'חסרים נתונים (טוקן, נתיב או קובץ)' });
    }

    // המרת הטקסט חזרה לקובץ אודיו תקני
    const buffer = Buffer.from(fileBase64, 'base64');
    const blob = new Blob([buffer], { type: 'audio/wav' });

    // שימוש באובייקט FormData תקני (עובד מצוין בשרתי Vercel מודרניים)
    const formData = new FormData();
    formData.append('token', token);
    formData.append('path', path);
    formData.append('file', blob, 'audio.wav');

    // שליחה לשרתים של בימות המשיח
    const response = await fetch('https://www.yemot.co.il/ym/api/UploadFile', {
      method: 'POST',
      body: formData
    });

    // קריאת התשובה הגולמית
    const textResponse = await response.text();

    try {
        // מנסים לתרגם את התשובה ל-JSON מסודר
        const data = JSON.parse(textResponse);
        return res.status(200).json(data);
    } catch(e) {
        // אם בימות מחזירים שוב דף שגיאה, הפעם לא ננחש למה, אלא נדפיס את השגיאה האמיתית שלהם
        console.error("Yemot Raw Response:", textResponse);
        return res.status(502).json({
            error: "השרת של בימות המשיח דחה את הקובץ. התשובה שלהם: " + textResponse.substring(0, 50) + "..."
        });
    }

  } catch (error) {
    return res.status(500).json({ error: "שגיאת Vercel פנימית: " + error.message });
  }
};
