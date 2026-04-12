const CustomError = require('../../types/customError');
const { HttpStatusText } = require('../../types/HTTPStatusText');
const UserModel = require('./user.model');

class UserService {
  static async getEmailUsers() {
    return await UserModel.getEmailUsers();
  }

  static async getPhoneUsers() {
    return await UserModel.getPhoneUsers();
  }

  static async getAllUsers() {
    return await UserModel.getAllUsers();
  }

  static async addUser({ email, phone }) {
    try {
      return await UserModel.addUser({ email, phone });
    } catch (error) {
      if (error && error.code === '23505') {
        const duplicateField = error.detail && error.detail.includes('phone') ? 'phone' : 'email';
        throw new CustomError(`User with this ${duplicateField} already exists.`, 409, HttpStatusText.FAIL);
      }
      throw new CustomError('Failed to add user.', 500, HttpStatusText.ERROR);
    }
  }

  static async removeUserByEmail(email) {
    const deletedRows = await UserModel.removeUserByEmail(email);

    if (!deletedRows) {
      throw new CustomError('User not found.', 404, HttpStatusText.FAIL);
    }
  }
}

module.exports = UserService;