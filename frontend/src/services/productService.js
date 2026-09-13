import { request } from './api';
export const productService = {
  getAll: () => request('/products'),
  getById: (id) => request(`/products/${id}`),
  getCategories: () => request('/categories')
};
