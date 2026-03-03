// src/Branch/branch.routes.js
'use strict';

import { Router } from 'express';
import {
    createBranch,
    getBranches,
    updateBranch,
    changeBranchStatus
} from './branch.controller.js';

import {
    validateCreateBranch,
    validateUpdateBranch,
    validateBranchIdParam
} from '../../middlewares/branch-validator.js';

import { uploadBranchImage } from '../../middlewares/file-uploader.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.post('/', validateJWT, uploadBranchImage.single('Photos'), validateCreateBranch, createBranch);
router.get('/', validateJWT, getBranches);
router.put('/:id', validateJWT, uploadBranchImage.single('Photos'), validateUpdateBranch, updateBranch);
router.patch('/:id/status', validateJWT, validateBranchIdParam, changeBranchStatus);

export default router;