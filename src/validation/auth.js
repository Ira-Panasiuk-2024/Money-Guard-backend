import Joi from 'joi';

export const registerUserSchema = Joi.object({
  name: Joi.string().min(2).max(20).required(),
  email: Joi.string().max(64).email().required(),
  password: Joi.string().min(6).max(20).required(),
  photo: Joi.string().allow(null).default(null),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().max(64).email().required(),
  password: Joi.string().min(6).max(20).required(),
});

export const requestPasswordResetSchema = Joi.object({
  email: Joi.string().max(64).email().required(),
});

export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).max(20).required(),
});
