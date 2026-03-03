import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateBilling = [
    body('Order')
        .notEmpty()
        .withMessage('La orden es requerida')
        .isMongoId()
        .withMessage('La orden debe ser un ObjectId válido'),

    body('BillSerie')
        .optional()
        .trim()
        .isLength({ max: 35 })
        .withMessage('La serie de la factura no puede tener más de 35 caracteres'),

    body('BillPaymentMethod')
        .notEmpty()
        .withMessage('El método de pago es requerido')
        .isIn(['CASH', 'CARD'])
        .withMessage('Método de pago no válido'),

    checkValidators,
];

export const validateUpdateBillingRequest = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido'),

    body('BillSerie')
        .optional()
        .trim()
        .isLength({ max: 35 })
        .withMessage('La serie no puede tener más de 35 caracteres'),

    body('BillPaymentMethod')
        .optional()
        .isIn(['CASH', 'CARD'])
        .withMessage('Método de pago no válido'),

    checkValidators,
];

export const validateBillingPay = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido'),

    checkValidators,
];

export const validateGetBillingById = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido'),

    checkValidators,
];