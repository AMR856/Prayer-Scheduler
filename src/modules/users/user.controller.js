const UserService = require('./user.service');
const { HttpStatusText } = require('../../types/HTTPStatusText');
const { NotificationService } = require('./user.notification.service');

class UserController {
  static async getUsers(req, res, next) {
    try {
      const users = await UserService.getAllUsers();
      return res.json({ status: HttpStatusText.SUCCESS, users });
    } catch (error) {
      return next(error);
    }
  }

  static async createUser(req, res, next) {
    try {
      const { email, phone } = req.body;
      const user = await UserService.addUser({ email, phone });
      await NotificationService.refreshRecipients();
      return res.status(201).json({ message: 'User added', status: HttpStatusText.SUCCESS, user });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { email } = req.params;
      await UserService.removeUserByEmail(email);
      await NotificationService.refreshRecipients();
      return res.json({ message: 'User deleted', status: HttpStatusText.SUCCESS });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = UserController;