import nodemailer from "nodemailer";

export const sendMail = async ({ to, subject, text, html }) => {
  try {
    // 1️⃣ Configure the transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // e.g., smtp.gmail.com
      port: 587,
      secure: false, // true for port 465, false for others
      auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_EMAIL_PASSWORD,
      },
    });

    // 2️⃣ Prepare the email options
    const mailOptions = {
      from: `<${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html, // optional
    };

    // 3️⃣ Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
};
