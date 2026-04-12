require('dotenv').config();
const express = require('express');
const userRoutes = require('./src/modules/users/user.route');
const errorHandler = require('./src/middlewares/errorHandler');
const { initUsersTable } = require('./src/modules/users/user.model');
const { NotificationService } = require('./src/modules/users/user.notification.service');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', userRoutes);
app.use(errorHandler);

const bootstrap = async () => {
  try {
    await initUsersTable();
    await NotificationService.start();

    app.listen(port, () => {
      console.log(`REST API running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

bootstrap();