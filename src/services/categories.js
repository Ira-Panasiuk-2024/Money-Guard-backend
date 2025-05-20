import { CategoriesCollection } from '../db/models/Categories.js';

export const getAllCategories = async (userId, type = null) => {
  const query = { owner: userId };

  if (type) {
    query.type = type;
  }

  const categories = await CategoriesCollection.find(query)
    .select('_id name type')
    .lean();

  return categories;
};
