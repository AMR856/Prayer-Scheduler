const nodemailer = require('nodemailer');
const axios = require('axios');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const userService = require('./user.service');
const toCron = require('../../utils/toCron');

class NotificationService {
  static #fromEmail = process.env.FROM_EMAIL;
  static #emailPassword = process.env.APP_PASSWORD;
  static #city = process.env.CITY;
  static #country = process.env.COUNTRY;
  static #method = 5;
  static #accountSid = process.env.TWILIO_ACCOUNT_SID;
  static #authToken = process.env.TWILIO_AUTH_TOKEN;
  static #whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
  static #scheduledTasks = [];
  static #emailUsers = [];
  static #phoneUsers = [];
  static #emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: NotificationService.#fromEmail,
      pass: NotificationService.#emailPassword
    }
  });
  static #twilioClient = require('twilio')(NotificationService.#accountSid, NotificationService.#authToken);

  static async #refreshRecipients() {
    try {
      const [emailUsers, phoneUsers] = await Promise.all([
        userService.getEmailUsers(),
        userService.getPhoneUsers()
      ]);

      NotificationService.#emailUsers = emailUsers;
      NotificationService.#phoneUsers = phoneUsers;
      console.log(
        `Recipients refreshed: ${emailUsers.length} email(s), ${phoneUsers.length} phone(s)`
      );
    } catch (err) {
      console.error('Error refreshing recipients:', err.message);
    }
  }

  static #generateIslamicFinderUrl() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return `https://www.islamicfinder.org/prayer-times/printmonthlyprayer/?timeInterval=month&month=${month}&year=${year}&calendarType=Gregorian`;
  }

  static #loadEmailTemplate(prayer, time) {
    try {
      const templatePath = path.join(__dirname, '..', '..', '..','templates', 'email-template.html');
      console.log('Loading email template from:', templatePath);
      let template = fs.readFileSync(templatePath, 'utf-8');
      template = template.replace(/{{PRAYER_NAME}}/g, prayer);
      template = template.replace(/{{PRAYER_TIME}}/g, time);
      template = template.replace(/{{ISLAMIC_FINDER_URL}}/g, NotificationService.#generateIslamicFinderUrl());
      return template;
    } catch (err) {
      console.error('Error loading email template:', err.message);
      return `<h2>It's time for ${prayer} prayer</h2><p>Time: <strong>${time}</strong></p>`;
    }
  }

  static async #sendEmailReminder(emailUsers, prayer, time) {
    if (!emailUsers.length) {
      return;
    }

    try {
      await NotificationService.#emailTransporter.sendMail({
        from: NotificationService.#fromEmail,
        to: emailUsers.join(','),
        subject: `It's time for ${prayer} prayer`,
        html: NotificationService.#loadEmailTemplate(prayer, time),
        text: `It's time for ${prayer} prayer at ${time}`
      });
      console.log(`Email sent for ${prayer} to ${emailUsers.length} users`);
    } catch (err) {
      console.error(`Error sending email for ${prayer}:`, err.message);
    }
  }

  static async #sendWhatsAppReminder(phoneUsers, prayer, time) {
    if (!phoneUsers.length) {
      return;
    }

    const message = `*${prayer} Prayer*\nTime: ${time}`;

    for (const phone of phoneUsers) {
      try {
        await NotificationService.#twilioClient.messages.create({
          from: NotificationService.#whatsappFrom,
          to: `whatsapp:${phone}`,
          body: message
        });
        console.log(`WhatsApp sent for ${prayer} to ${phone}`);
      } catch (err) {
        console.error(`Error sending WhatsApp to ${phone}:`, err.message);
      }
    }
  }

  static async #handleCron() {
    NotificationService.#scheduledTasks.forEach((task) => task.stop());
    NotificationService.#scheduledTasks = [];

    try {
      const response = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity?city=${NotificationService.#city}&country=${NotificationService.#country}&method=${NotificationService.#method}`
      );
      const timings = response.data.data.timings;
      await NotificationService.#refreshRecipients();

      const cronExpressions = {
        Fajr: toCron(timings.Fajr),
        Dhuhr: toCron(timings.Dhuhr),
        Asr: toCron(timings.Asr),
        Maghrib: toCron(timings.Maghrib),
        Isha: toCron(timings.Isha)
      };

      for (const [prayer, cronTime] of Object.entries(cronExpressions)) {
        const task = cron.schedule(
          cronTime,
          async () => {
            console.log(`Triggering ${prayer} notification at ${new Date().toLocaleString()}`);
            await Promise.all([
              NotificationService.#sendEmailReminder(
                NotificationService.#emailUsers,
                prayer,
                timings[prayer]
              ),
              NotificationService.#sendWhatsAppReminder(
                NotificationService.#phoneUsers,
                prayer,
                timings[prayer]
              )
            ]);
          },
          {
            timezone: 'Africa/Cairo'
          }
        );

        NotificationService.#scheduledTasks.push(task);
      }

      console.log('Prayer times fetched and jobs scheduled.');
    } catch (err) {
      console.error('Error fetching prayer times:', err.message);
    }
  }

  static async start() {
    console.log('Starting notification scheduler...');
    this.#loadEmailTemplate();
    await NotificationService.#handleCron();

    cron.schedule(
      '0 1 * * *',
      async () => {
        console.log('Refreshing prayer times...');
        await NotificationService.#handleCron();
      },
      {
        timezone: 'Africa/Cairo'
      }
    );

    console.log('Notification scheduler is running.');
  }

  static stop() {
    NotificationService.#scheduledTasks.forEach((task) => task.stop());
    NotificationService.#scheduledTasks = [];
    console.log('Notification scheduler stopped.');
  }

  static async refreshRecipients() {
    await NotificationService.#refreshRecipients();
  }
}

module.exports = {NotificationService};