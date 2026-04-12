# Prayer Reminder

Node.js worker that fetches daily prayer times and sends reminders by email and WhatsApp.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
FROM_EMAIL=you@gmail.com
APP_PASSWORD=your-gmail-app-password
CITY=Cairo
COUNTRY=Egypt
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Option A (recommended for Heroku): comma-separated users from env vars
USERS_EMAILS=user1@example.com,user2@example.com
USERS_PHONES=+201000000000,+201111111111

# Option B (local file fallback): file paths
USERS_EMAILS_PATH=./users-emails.txt
USERS_PHONES_PATH=./users-phones.txt
```

3. Start the service:

```bash
npm start
```

## Heroku deployment

This app is configured as a worker dyno using `Procfile`:

```text
worker: npm start
```

1. Create app and push code:

```bash
heroku login
heroku create <your-app-name>
git push heroku main
```

2. Set required config vars:

```bash
heroku config:set FROM_EMAIL="you@gmail.com"
heroku config:set APP_PASSWORD="your-gmail-app-password"
heroku config:set CITY="Cairo"
heroku config:set COUNTRY="Egypt"
heroku config:set TWILIO_ACCOUNT_SID="your-twilio-sid"
heroku config:set TWILIO_AUTH_TOKEN="your-twilio-token"
heroku config:set TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
heroku config:set USERS_EMAILS="user1@example.com,user2@example.com"
heroku config:set USERS_PHONES="+201000000000,+201111111111"
```

3. Scale the worker dyno:

```bash
heroku ps:scale worker=1
```

4. Check logs:

```bash
heroku logs --tail
```

## Notes

- `USERS_EMAILS` and `USERS_PHONES` are preferred for deployment.
- If env user lists are missing, the app falls back to file paths.
- Timezone is set to `Africa/Cairo` for all scheduled notifications.