// קובץ: api/upload.js
// זהו השרת שלנו שמתווך בין הדפדפן לבין בימות המשיח

export default async function handler(req, res) {
  // מוודאים שהבקשה היא מסוג POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // מקבלים את הנתונים שהדפדפן שלח אלינו
    const { token, path, fileBase64 } = req.body;

    if (!token || !path || !fileBase64) {
      return res.status(400).json({ message: 'חסרים נתונים (טוקן, נתיב או קובץ)' });
    }

    // הדפדפן שלח את הקובץ כטקסט (Base64), אנחנו ממירים אותו חזרה לקובץ אודיו
    const buffer = Buffer.from(fileBase64, 'base64');
    const fileBlob = new Blob([buffer], { type: 'audio/wav' });

    // בונים את החבילה לשליחה לבימות המשיח
    const formData = new FormData();
    formData.append('token', token);
    formData.append('path', path);
    formData.append('file', fileBlob, 'audio.wav');

    // שולחים את הקובץ מהשרת שלנו לשרתים של בימות המשיח
    const response = await fetch('https://www.yemot.co.il/ym/api/UploadFile', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    // מחזירים את התשובה חזרה לדפדפן
    return res.status(200).json(data);

  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ message: error.message || 'שגיאת שרת פנימית' });
  }
}
