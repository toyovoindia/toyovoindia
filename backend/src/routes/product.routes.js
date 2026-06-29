import express from 'express';
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminPermanentlyDeleteProduct,
  adminGetProduct,
  adminListProducts,
  adminUpdateProduct,
  adminUpdateProductStatus,
  adminUpdateProductStock,
  getProductBrands,
  getProductFilters,
  getProductBySlug,
  listBestSellers,
  listFeaturedProducts,
  listNewArrivals,
  listProducts,
  listTrendingProducts,
} from '../controllers/product.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createProductSchema,
  listProductsSchema,
  productIdParamSchema,
  productStatusSchema,
  productStockSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

const router = express.Router();
const adminRouter = express.Router();

router.get('/', validate(listProductsSchema), listProducts);
router.get('/featured', listFeaturedProducts);
router.get('/trending', listTrendingProducts);
router.get('/new-arrivals', listNewArrivals);
router.get('/best-sellers', listBestSellers);
router.get('/brands', getProductBrands);
router.get('/filters', getProductFilters);
router.get('/:slug', getProductBySlug);

adminRouter.use(protect, authorizeRoles('admin', 'super_admin'));
adminRouter.get('/', adminListProducts);
adminRouter.post('/', validate(createProductSchema), adminCreateProduct);
adminRouter.get('/:id', validate(productIdParamSchema), adminGetProduct);
adminRouter.patch('/:id', validate(updateProductSchema), adminUpdateProduct);
adminRouter.delete('/:id', validate(productIdParamSchema), adminDeleteProduct);
adminRouter.delete('/:id/permanent', validate(productIdParamSchema), adminPermanentlyDeleteProduct);
adminRouter.patch('/:id/status', validate(productStatusSchema), adminUpdateProductStatus);
adminRouter.patch('/:id/stock', validate(productStockSchema), adminUpdateProductStock);

export { adminRouter as adminProductRoutes };
export default router;
