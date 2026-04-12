const CustomError = require('../types/customError');
const { HttpStatusText } = require('../types/HTTPStatusText');

const formatZodErrors = (error) => {
	return error.issues
		.map((e) => `${e.path.join('.')}: ${e.message}`)
		.join(', ');
};

const validate = (schema, target = 'body') => {
	return (req, res, next) => {
		const result = schema.safeParse(req[target]);

		if (!result.success) {
			const message = formatZodErrors(result.error);
			return next(new CustomError(message, 400, HttpStatusText.FAIL));
		}

		req[target] = result.data;
		return next();
	};
};

module.exports = validate;
