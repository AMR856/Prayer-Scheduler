const nodemailer = require('nodemailer');
require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const utils = require('./utils');
const fs = require('fs');
const path = require('path');

const fromEmail = process.env.FROM_EMAIL;
const emailUsersPath = process.env.USERS_EMAILS_PATH;
const phoneUsersPath = process.env.USERS_PHONES_PATH;
const emailUsersEnv = process.env.USERS_EMAILS;
const phoneUsersEnv = process.env.USERS_PHONES;
const emailPassword = process.env.APP_PASSWORD;
const city = process.env.CITY;
const country = process.env.COUNTRY;
const method = 5;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
const twilioClient = require('twilio')(accountSid, authToken);

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: fromEmail,
    pass: emailPassword
  }
});

const readUsersFromFile = (filePath) => {
  if (!filePath) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err.message);
    return [];
  }
};

const readUsersFromEnv = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const generateIslamicFinderUrl = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `https://www.islamicfinder.org/prayer-times/printmonthlyprayer/?timeInterval=month&month=${month}&year=${year}&calendarType=Gregorian`;
};

const loadEmailTemplate = (prayer, time) => {
  try {
    const templatePath = path.join(__dirname, 'templates', 'email-template.html');
    let template = fs.readFileSync(templatePath, 'utf-8');
    template = template.replace(/{{PRAYER_NAME}}/g, prayer);
    template = template.replace(/{{PRAYER_TIME}}/g, time);
    template = template.replace(/{{ISLAMIC_FINDER_URL}}/g, generateIslamicFinderUrl());
    return template;
  } catch (err) {
    console.error(`Error loading email template:`, err.message);
    return `
      <h2>🕌 It's time for ${prayer} prayer</h2>
      <p>⏰ Time: <strong>${time}</strong></p>
    `;
  }
};

const sendEmailReminder = async (emailUsers, prayer, time) => {
  if (!emailUsers || emailUsers.length === 0) {
    console.log(`No email users to notify for ${prayer}`);
    return;
  }

  const htmlContent = loadEmailTemplate(prayer, time);

  const mailOptions = {
    from: fromEmail,
    to: emailUsers.join(','),
    subject: `🕌 It's time for ${prayer} prayer`,
    html: htmlContent,
    text: `It's time for ${prayer} prayer at ${time}`
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent for ${prayer} to ${emailUsers.length} users: ${info.messageId}`);
  } catch (err) {
    console.error(`Error sending email for ${prayer}:`, err.message);
  }
};

const sendWhatsAppReminder = async (phoneUsers, prayer, time) => {
  if (!phoneUsers || phoneUsers.length === 0) {
    console.log(`No WhatsApp users to notify for ${prayer}`);
    return;
  }

  const message = `🕌 *${prayer} Prayer*\n⏰ Time: ${time}`;

  for (const phone of phoneUsers) {
    try {
      const result = await twilioClient.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${phone}`,
        body: message
      });
      console.log(`WhatsApp sent for ${prayer} to ${phone}: ${result.sid}`);
    } catch (err) {
      console.error(`Error sending WhatsApp to ${phone}:`, err.message);
    }
  }
};

let scheduledTasks = [];

const handleCron = async () => {
  scheduledTasks.forEach(task => task.stop());
  scheduledTasks = [];

  try {
    const response = await axios.get(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`
    );
    const timings = response.data.data.timings;

    const emailUsersFromEnv = readUsersFromEnv(emailUsersEnv);
    const phoneUsersFromEnv = readUsersFromEnv(phoneUsersEnv);

    const emailUsers = emailUsersFromEnv.length > 0
      ? emailUsersFromEnv
      : readUsersFromFile(emailUsersPath);
    const phoneUsers = phoneUsersFromEnv.length > 0
      ? phoneUsersFromEnv
      : readUsersFromFile(phoneUsersPath);

    const cronExpressions = {
      Fajr: utils.toCron(timings.Fajr),
      Dhuhr: utils.toCron(timings.Dhuhr),
      Asr: utils.toCron(timings.Asr),
      Maghrib: utils.toCron(timings.Maghrib),
      Isha: utils.toCron(timings.Isha),
    };

    console.log('Cron Expressions:', cronExpressions);
    console.log(`Email users: ${emailUsers.length}`);
    console.log(`WhatsApp users: ${phoneUsers.length}`);

    for (const [prayer, cronTime] of Object.entries(cronExpressions)) {
      const task = cron.schedule(cronTime, async () => {
        console.log(`\nTriggering ${prayer} notification at ${new Date().toLocaleString()}`);
        
        await Promise.all([
          sendEmailReminder(emailUsers, prayer, timings[prayer]),
          sendWhatsAppReminder(phoneUsers, prayer, timings[prayer])
        ]);
      }, {
        timezone: 'Africa/Cairo'
      });

      scheduledTasks.push(task);
    }

    console.log('Prayer times fetched and jobs scheduled.\n');
  } catch (err) {
    console.error('Error fetching prayer times:', err.message);
  }
};

const main = () => {
  try {
    console.log('Starting prayer reminder service...\n');
    handleCron();

    cron.schedule('0 1 * * *', async () => {
      console.log('\nRefreshing prayer times...\n');
      await handleCron();
    }, {
      timezone: 'Africa/Cairo'
    });

    console.log('Prayer reminder service is running. Press Ctrl+C to stop.\n');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
};

main();