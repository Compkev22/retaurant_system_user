// src/middlewares/branch-validator.js
import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

const branchStatuses = ['ACTIVE', 'INACTIVE'];

export const validateCreateBranch = [

    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string'),

    body('address')
        .notEmpty().withMessage('Address is required')
        .isString().withMessage('Address must be a string'),

    body('city')
        .optional()
        .isString().withMessage('City must be a string'),

    body('zone')
        .notEmpty().withMessage('Zone is required')
        .isInt({ min: 1 }).withMessage('Zone must be a positive number'),

    body('phone')
        .notEmpty().withMessage('Phone is required')
        .isNumeric().withMessage('Phone must be a number'),

    body('tableCapacity')
        .optional()
        .isInt({ min: 0 }).withMessage('Table capacity must be 0 or greater'),

    body('hasDriveThru')
        .optional()
        .isBoolean().withMessage('hasDriveThru must be boolean'),

    body('branchStatus')
        .optional()
        .isIn(branchStatuses).withMessage('Invalid branchStatus'),

    checkValidators
];

export const validateUpdateBranch = [

    param('id')
        .isMongoId().withMessage('Invalid branch ID'),

    body('name')
        .optional()
        .isString().withMessage('Name must be a string'),

    body('address')
        .optional()
        .isString().withMessage('Address must be a string'),

    body('city')
        .optional()
        .isString().withMessage('City must be a string'),

    body('zone')
        .optional()
        .isInt({ min: 1 }).withMessage('Zone must be a positive number'),

    body('phone')
        .optional()
        .isNumeric().withMessage('Phone must be a number'),

    body('tableCapacity')
        .optional()
        .isInt({ min: 0 }).withMessage('Table capacity must be 0 or greater'),

    body('hasDriveThru')
        .optional()
        .isBoolean().withMessage('hasDriveThru must be boolean'),

    body('branchStatus')
        .optional()
        .isIn(branchStatuses).withMessage('Invalid branchStatus'),

    checkValidators
];

export const validateBranchIdParam = [
    param('id')
        .isMongoId().withMessage('Invalid branch ID'),
    checkValidators
];