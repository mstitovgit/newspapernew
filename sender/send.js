const nodemailer = require("nodemailer");
const fs = require("fs");

const name = new Date()
  .toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  .toUpperCase();

const transporter = nodemailer.createTransport({
  host: "smtp.mail.ru",
  port: 465,
  secure: true,
  auth: {
    user: "mstitov@inbox.ru",
    pass: "lZThjOeelYWKDUWUiBnG", 
  },
});

(async () => {
  const info = await transporter.sendMail({
    from: '"Максим Газета" <mstitov@inbox.ru>',
    to: "mstitov.mail_lHtRlP@kindle.com",
    text: "",
    attachments: [
      {
        filename: `${name}.pdf`,
        path: "./generated/output.pdf", // путь к файлу
        contentType: "application/pdf",
      },
    ],
  });

  console.log("✅ Письмо отправлено:", info.messageId);
})();