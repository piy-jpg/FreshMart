const { productController } = require('../controllers');

async function handleProductRoutes(req, res, pathname, method) {
  if (pathname === '/api/products' && method === 'GET') {
    return productController.getAll(req, res);
  }
  if (pathname === '/api/categories' && method === 'GET') {
    return productController.getCategories(req, res);
  }

  const idMatch = pathname.match(/^\/api\/products\/([^\/]+)$/);
  if (idMatch && method === 'GET') {
    return productController.getById(req, res, idMatch[1]);
  }

  return false;
}

module.exports = handleProductRoutes;
