import { Router } from 'express';

import {
  registerUserController,
  loginUserController,
  logoutUserController,
  verifyEmailController,
  requestPasswordResetController,
  resetPasswordController,
} from '../controllers/auth.js';

import {
  registerUserSchema,
  loginUserSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '../validation/auth.js';

import { authenticate } from '../middlewares/authenticate.js';

import { validateBody } from '../middlewares/validateBody.js';

import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);

authRouter.post(
  '/login',
  validateBody(loginUserSchema),
  ctrlWrapper(loginUserController),
);

authRouter.post('/logout', authenticate, ctrlWrapper(logoutUserController));

authRouter.get('/verify', ctrlWrapper(verifyEmailController));

authRouter.post(
  '/request-reset-password',
  validateBody(requestPasswordResetSchema),
  ctrlWrapper(requestPasswordResetController),
);

authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  ctrlWrapper(resetPasswordController),
);

export default authRouter;
