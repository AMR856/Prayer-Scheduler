const express = require('express');
const userController = require('./user.controller');
const { UserValidationSchema } = require('./user.validation');
const validate = require('../../middlewares/validate');
const router = express.Router();

router.get('/', userController.getUsers);
router.post('/', validate(UserValidationSchema.createUser), userController.createUser);
router.delete('/:email', validate(UserValidationSchema.deleteUser, 'params'), userController.deleteUser);

module.exports = router;
