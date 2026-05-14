const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, message, html }) => {
  if (process.env.EMAIL_USER === 'your_email@gmail.com') {
    console.log('\n--- DEVELOPMENT EMAIL SIMULATION ---');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('HTML Context:', html);
    console.log('------------------------------------\n');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: `"StudXWork" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: message,
      html
    });
    console.log(`✅ Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.log('\n--- FALLBACK: EMAIL SIMULATION (OTP in console) ---');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('OTP Link/Code:', html.match(/>\d{4}</) ? html.match(/>\d{4}</)[0].replace(/[><]/g, '') : 'No OTP found');
    console.log('--------------------------------------------------\n');
    return true; // Return true to avoid blocking the main flow
  }
};

module.exports = sendEmail;
