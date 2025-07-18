const nodemailer = require('nodemailer');
require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const utils = require('./utils');
const fs = require('fs');

const fromEmail = process.env.FROM_EMAIL;
const usersPath = process.env.USERS_PATH;
const password = process.env.APP_PASSWORD;
const subject = "It's time to pray";
const city = 'Alexandria';
const country = 'Egypt';
const method = 5;
const toEmail = fs.readFileSync(usersPath, 'utf-8').replace('\n', ',');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: fromEmail,
    pass: password
  }
});

const handleCorn = async () => {
    const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`);
    const timings = response.data.data.timings;

    const cronExpressions = {
      Fajr: utils.toCron(timings.Fajr),
      Dhuhr: utils.toCron(timings.Dhuhr),
      Asr: utils.toCron(timings.Asr),
      Maghrib: utils.toCron(timings.Maghrib),
      Isha: utils.toCron(timings.Isha),
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
      }, {
        timezone: 'Africa/Cairo'
      });
    }
    console.log("✅ Prayer times fetched and jobs scheduled.");
}



const main = () => {
  try {
    // Handling Corn for the first time running the program
    handleCorn();
    // Refresh timings daily at 1:00 AM and schedule jobs
    cron.schedule('1 1 * * *', async () => {
      try {
        await handleCorn();
      } catch (err) {
        console.error("❌ Error fetching prayer times:", error);
      }
    }, {
      timezone: 'Africa/Cairo'
    });
  } catch(err) {
    console.error("❌ Error fetching prayer times:", err);
  }
}

main();