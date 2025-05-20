import { getAllCategories } from '../services/categories.js';

export const getAllCategoriesController = async (req, res, next) => {
  const { type } = req.query;
  const userId = req.user._id;

  if (type && !['income', 'expense'].includes(type)) {
    return res.status(400).json({
      status: 400,
      message: 'Invalid category type. Must be "income" or "expense".',
    });
  }

  const categories = await getAllCategories(userId, type);

  res.status(200).json({
    status: 200,
    message: 'Successfully found all categories!',
    categories,
  });
};
