const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.MAILER_PORT || 3000;

app.post('/send-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  console.log(`--- [NODEMAILER DEBUG] Attempting send to: ${email} | OTP: ${otp} ---`);

  if (!user || !pass || user.includes('your-gmail')) {
    console.error('--- [NODEMAILER ERROR] SMTP credentials not configured correctly ---');
    return res.status(400).json({ error: 'SMTP credentials missing' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  const mailOptions = {
    from: `"Castle Kingdom" <${user}>`,
    to: email,
    subject: 'Your Security Verification Code- mail from nodemailer',
    text: `Noble Ruler,\n\nYour security code for Castle Kingdom is: ${otp}\n\nExpires in 5 minutes.\n\nForge your legend,\nThe Castle Kingdom Team`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`--- [NODEMAILER SUCCESS] Email sent to ${email} ---`);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('--- [NODEMAILER CRITICAL] Failed to send email:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Mailer microservice active on port ${PORT}`);
});
