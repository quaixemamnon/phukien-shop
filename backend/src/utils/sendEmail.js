const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) !== 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Gửi email. Nếu chưa cấu hình SMTP thì chỉ in ra console để tiện thử nghiệm
async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.log(`\n[EMAIL - chưa cấu hình SMTP]\nTới: ${to}\nTiêu đề: ${subject}\n${html.replace(/<[^>]+>/g, ' ')}\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html });
  } catch (err) {
    console.error('Gửi email thất bại:', err.message);
  }
}

module.exports = sendEmail;
