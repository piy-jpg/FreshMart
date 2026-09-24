const { productController } = require('../controllers');
const { parseBody } = require('../../server');

async function handleProductRoutes(req, res, pathname, method) {
  if (pathname === '/api/products' && method === 'GET') {
    return productController.getAll(req, res);
  }
  if (pathname === '/api/categories' && method === 'GET') {
    return productController.getCategories(req, res);
  }
  if (pathname === '/api/products' && method === 'POST') {
    let body = req.body;
    if (!body && typeof parseBody === 'function') body = await parseBody(req);
    return productController.create(req, res, body || {});
  }

  const idMatch = pathname.match(/^\/api\/products\/([^\/]+)$/);
  if (idMatch) {
    const id = idMatch[1];
    if (method === 'GET') return productController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') {
      let body = req.body;
      if (!body && typeof parseBody === 'function') body = await parseBody(req);
      return productController.update(req, res, id, body || {});
    }
    if (method === 'DELETE') return productController.delete(req, res, id);
  }

  return false;
}

module.exports = handleProductRoutes;
