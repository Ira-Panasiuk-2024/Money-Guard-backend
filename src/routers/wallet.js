import { Router } from 'express';

import {
  getTransactionsController,
  createTransactionsController,
  updateTransactionsController,
  deleteTransactionsController,
  getTransactionsByPeriodController,
} from '../controllers/wallet.js';

import { ctrlWrapper } from '../utils/ctrlWrapper.js';

import { isValidId } from '../middlewares/isValidID.js';
import { validateBody } from '../middlewares/validateBody.js';
import { authenticate } from '../middlewares/authenticate.js';

import {
  createTransactionsSchema,
  updateTransactionsSchema,
} from '../validation/wallet.js';

const transactionsRouter = Router();

transactionsRouter.use(authenticate);

transactionsRouter.get('/', ctrlWrapper(getTransactionsController));

transactionsRouter.post(
  '/',
  validateBody(createTransactionsSchema),
  ctrlWrapper(createTransactionsController),
);

transactionsRouter.patch(
  '/:id',
  isValidId,
  validateBody(updateTransactionsSchema),
  ctrlWrapper(updateTransactionsController),
);

transactionsRouter.delete(
  '/:id',
  isValidId,
  ctrlWrapper(deleteTransactionsController),
);

transactionsRouter.get(
  '/statistics',
  ctrlWrapper(getTransactionsByPeriodController),
);

export default transactionsRouter;
