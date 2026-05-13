module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  try {
    const { token, path, fileBase64 } = req.body;
    if (!token || !path || !fileBase64) return res.status(400).json({ error: 'חסרים נתונים' });

    // ממירים את האודיו בחזרה
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const boundary = '----VoiceMasterBoundary' + Date.now();
    
    // בונים את החבילה בצורה היציבה ביותר
    let headerData = '--' + boundary + '\r\n';
    headerData += 'Content-Disposition: form-data; name="token"\r\n\r\n' + token + '\r\n';
    headerData += '--' + boundary + '\r\n';
    headerData += 'Content-Disposition: form-data; name="path"\r\n\r\n' + path + '\r\n';
    headerData += '--' + boundary + '\r\n';
    headerData += 'Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n';
    headerData += 'Content-Type: audio/wav\r\n\r\n';

    const finalBody = Buffer.concat([
        Buffer.from(headerData, 'utf8'),
        fileBuffer,
        Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8')
    ]);

    // שליחה לבימות המשיח
    const response = await fetch('https://www.yemot.co.il/ym/api/UploadFile', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': finalBody.length
      },
      body: finalBody
    });

    // קריאת התשובה כטקסט קודם, למקרה שבימות המשיח חוסמים ומחזירים HTML
    const textResponse = await response.text(); 
    
    try {
        const data = JSON.parse(textResponse);
        return res.status(200).json(data);
    } catch(e) {
        return res.status(502).json({ 
            error: "תשובה לא תקינה מבימות המשיח. ייתכן שבימות חוסמים את Vercel.", 
            details: textResponse.substring(0, 150) 
        });
    }
  } catch (error) {
    return res.status(500).json({ error: "שגיאת שרת פנימית ב-Vercel: " + error.message });
  }
};
