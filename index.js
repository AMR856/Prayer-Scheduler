const nodemailer = require('nodemailer');
require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');

const fromEmail = process.env.FROM_EMAIL;
const toEmail = process.env.TO_EMAIL;
const password = process.env.APP_PASSWORD;
const subject = "Prayer's time";
const city = 'Alexandria';
const country = 'Egypt';
const method = 5;

const removeLeadingZeros = (str) => String(parseInt(str, 10));
const toCron = (time) => {
  const [hour, minute] = time.split(':').map(removeLeadingZeros);
  return `${minute} ${hour} * * *`;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: fromEmail,
    pass: password
  }
});

// Refresh timings daily at 1:00 AM and schedule jobs
cron.schedule('1 1 * * *', async () => {
  try {
    const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`);
    const timings = response.data.data.timings;

    const cronExpressions = {
      Fajr: toCron(timings.Fajr),
      Dhuhr: toCron(timings.Dhuhr),
      Asr: toCron(timings.Asr),
      Maghrib: toCron(timings.Maghrib),
      Isha: toCron(timings.Isha),
    };
    console.log(cronExpressions);
    for (const [prayer, cronTime] of Object.entries(cronExpressions)) {
      cron.schedule(cronTime, () => {
        const mailOptions = {
          from: fromEmail,
          to: toEmail,
          subject: subject,
          text: `🕌 It's time for ${prayer} prayer.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.error(error);
          }
          console.log(`Email sent for ${prayer}: ${info.response}`);
        });
      });
    }

    console.log("Cron job started at:", new Date().toString()); // This will be in UTC 
    console.log("✅ Prayer times fetched and jobs scheduled.");
  } catch (error) {
    console.error("❌ Error fetching prayer times:", error);
  }
}, {
  timezone: 'Africa/Cairo'
});
