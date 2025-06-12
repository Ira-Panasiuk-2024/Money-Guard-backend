import createHttpError from 'http-errors';
import { Types } from 'mongoose';
import mongoose from 'mongoose';

import { TransactionsCollection } from '../db/models/Transactions.js';
import { UsersCollection } from '../db/models/Users.js';
import { CategoriesCollection } from '../db/models/Categories.js';

import { MINIMUM_YEAR } from '../constants/index.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';
import {
  updateBalanceOnCreate,
  updateBalanceOnUpdate,
  updateBalanceOnDelete,
} from '../utils/balanceUtil.js';

const EXCLUDE_FIELDS = '-userId -createdAt -updatedAt -__v';

export const getTransactions = async (
  userId,
  { page = 1, perPage = 8, sortOrder = 'desc' } = {},
) => {
  if (page < 1) {
    page = 1;
  }
  const skip = (page - 1) * perPage;

  const [transactions, totalCount] = await Promise.all([
    TransactionsCollection.find({ userId })
      .sort({ date: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(perPage)
      .select(EXCLUDE_FIELDS)
      .populate('categoryId', 'name'),
    TransactionsCollection.countDocuments({ userId }),
  ]);

  const pageInfo = calculatePaginationData(page, perPage, totalCount);

  return {
    transactions,
    pageInfo,
  };
};

export const createTransactions = async (userId, payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await UsersCollection.findById(userId, null, { session });
    if (!user) {
      throw createHttpError(404, 'User not found!');
    }

    const category = await CategoriesCollection.findById(
      payload.categoryId,
      null,
      { session },
    );
    if (!category) {
      throw createHttpError(404, 'Category not found!');
    }

    if (payload.type && payload.type !== category.type) {
      await session.abortTransaction();
      throw createHttpError(
        400,
        `Category type "${category.type}" does not match transaction type "${payload.type}"`,
      );
    }

    const transactionData = {
      userId,
      ...payload,
    };

    const newTransaction = await TransactionsCollection.create(
      [transactionData],
      { session },
    );

    const balance = await updateBalanceOnCreate(userId, payload, session);

    const createdAndPopulatedTransaction =
      await TransactionsCollection.findById(newTransaction[0]._id, null, {
        session,
      })

        .select(EXCLUDE_FIELDS)
        .populate('categoryId', 'name');

    await session.commitTransaction();

    return {
      transaction: createdAndPopulatedTransaction,
      balance,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Transaction aborted due to an error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteTransactions = async (id, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await TransactionsCollection.findOne(
      {
        _id: id,
        userId,
      },
      null,
      { session },
    )
      .select(EXCLUDE_FIELDS)
      .populate('categoryId', 'name');

    if (!transaction) {
      await session.abortTransaction();
      return null;
    }

    const balance = await updateBalanceOnDelete(userId, transaction, session);

    await TransactionsCollection.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    return {
      transaction,
      balance,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Transaction aborted due to an error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateTransactions = async (id, payload, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const oldTransaction = await TransactionsCollection.findOne(
      {
        _id: id,
        userId,
      },
      null,
      { session },
    );

    if (!oldTransaction) {
      await session.abortTransaction();
      throw createHttpError(404, 'Transaction not found!');
    }

    if (payload.categoryId) {
      const category = await CategoriesCollection.findById(
        payload.categoryId,
        null,
        { session },
      );
      if (!category) {
        await session.abortTransaction();
        throw createHttpError(404, 'Category not found!');
      }

      if (payload.type && payload.type !== category.type) {
        await session.abortTransaction();
        throw createHttpError(
          400,
          `Category type "${category.type}" does not match transaction type "${payload.type}"`,
        );
      } else if (!payload.type && oldTransaction.type !== category.type) {
        await session.abortTransaction();
        throw createHttpError(
          400,
          `New category type "${category.type}" does not match existing transaction type "${oldTransaction.type}"`,
        );
      }
    }

    const newTransactionData = {
      ...oldTransaction.toObject(),
      ...payload,
    };

    const balance = await updateBalanceOnUpdate(
      userId,
      oldTransaction,
      newTransactionData,
      session,
    );

    const updatedTransaction = await TransactionsCollection.findOneAndUpdate(
      { _id: id, userId },
      payload,
      { new: true, session },
    )
      .select(EXCLUDE_FIELDS)
      .populate('categoryId', 'name');

    if (!updatedTransaction) {
      await session.abortTransaction();
      throw createHttpError(500, 'Failed to update transaction');
    }

    await session.commitTransaction();

    return {
      transaction: updatedTransaction,
      balance,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Transaction aborted due to an error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

export const getTransactionsByPeriod = async (userId, year, month) => {
  if (year < MINIMUM_YEAR) {
    throw createHttpError(
      400,
      `Data available only from ${MINIMUM_YEAR}. Requested year is ${year}.`,
    );
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    throw createHttpError(400, 'Period cannot be in the future.');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const userObjectId =
    typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  const result = await TransactionsCollection.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startDate, $lte: endDate },
      },
    },

    {
      $facet: {
        summary: [
          {
            $group: {
              _id: '$type',
              total: { $sum: '$sum' },
            },
          },
        ],

        categories: [
          {
            $lookup: {
              from: 'categories',
              localField: 'categoryId',
              foreignField: '_id',
              as: 'category',
            },
          },

          {
            $unwind: {
              path: '$category',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $group: {
              _id: {
                categoryId: '$categoryId',
                type: '$type',
                categoryName: '$category.name',
              },
              total: { $sum: '$sum' },
            },
          },

          {
            $project: {
              _id: 0,
              type: '$_id.type',
              categoryId: '$_id.categoryId',
              categoryName: '$_id.categoryName',
              total: 1,
            },
          },
        ],

        transactionsCount: [
          {
            $count: 'count',
          },
        ],
      },
    },
  ]);

  const user = await UsersCollection.findById(userId).select('balance').lean();
  const currentBalance = user ? user.balance : 0;

  const [stats] = result;

  const totalIncome = stats.summary.find((x) => x._id === 'income')?.total || 0;
  const totalExpense =
    stats.summary.find((x) => x._id === 'expense')?.total || 0;

  const categoryExpenses = {};
  stats.categories
    .filter(
      (cat) => cat.type === 'expense' && cat.total > 0 && cat.categoryName,
    )
    .forEach((cat) => {
      categoryExpenses[cat.categoryName] = parseFloat(cat.total.toFixed(2));
    });

  const categoryIncomes = {};
  stats.categories
    .filter((cat) => cat.type === 'income' && cat.total > 0 && cat.categoryName)
    .forEach((cat) => {
      categoryIncomes[cat.categoryName] = parseFloat(cat.total.toFixed(2));
    });

  const periodTransactionsSum = parseFloat(
    (Math.abs(totalIncome) + Math.abs(totalExpense)).toFixed(2),
  );
  const periodTransactionsCount =
    stats.transactionsCount.length > 0 ? stats.transactionsCount[0].count : 0;

  const response = {
    totalBalance: parseFloat(currentBalance.toFixed(2)),
    periodIncomeOutcome: parseFloat((totalIncome - totalExpense).toFixed(2)),
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    totalExpense: parseFloat(totalExpense.toFixed(2)),
    categoryExpenses,
    categoryIncomes,
    periodTransactionsSum: periodTransactionsSum,
    periodTransactionsCount: periodTransactionsCount,
  };

  return response;
};
