'use strict';

import { Router } from 'express';
import { getProducts, createProduct, updatedProduct, changeProductStatus } from './product.controller.js';
import { validateCreateProduct, validateProductId } from '../../middlewares/product.validator.js';
import { uploadProductImage } from '../../middlewares/file-uploader.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';


const router = Router();

router.get('/', validateJWT, getProducts);
router.post('/', validateJWT, uploadProductImage.single('imagen'), validateCreateProduct, createProduct);
router.put('/:id', validateJWT, uploadProductImage.single('imagen'), validateProductId, updatedProduct);
router.patch('/:id/status', validateJWT, validateProductId, changeProductStatus);
export default router;