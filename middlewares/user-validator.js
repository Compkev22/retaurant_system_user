import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateUser = [
    body('UserName')
        .trim()
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('UserSurname')
        .trim()
        .notEmpty()
        .withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El apellido debe tener entre 2 y 100 caracteres'),

    body('UserEmail')
        .trim()
        .notEmpty()
        .withMessage('El correo es requerido'),

    body('UserStatus')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE'])
        .withMessage('Estado no válido'),

    checkValidators,
];


export const validateUpdateUserRequest = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId'),

    body('UserName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('UserSurname')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El apellido debe tener entre 2 y 100 caracteres'),

    body('UserEmail')
        .optional()
        .trim(),

    body('UserStatus')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE'])
        .withMessage('Estado no válido'),

    checkValidators,
];

export const validateUserStatusChange = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId'),

    checkValidators,
];

export const validateGetUserById = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId'),

    checkValidators,
];
