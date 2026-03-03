import { body, validationResult } from 'express-validator';

const validateFields = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación en el inventario',
            errors: errors.array()
        });
    }
    next();
};

export const inventoryValidator = [
    body('name', 'El nombre es obligatorio').notEmpty(),
    body('description', 'La descripción es obligatoria').notEmpty(),
    body('stock', 'El stock debe ser un número entero positivo').isInt({ min: 0 }),
    body('unitCost', 'El costo unitario debe ser un número positivo').isFloat({ min: 0 }),
    validateFields 
];

export const updateInventoryValidator = [
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('description').optional().notEmpty().withMessage('La descripción no puede estar vacía'),
    body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
    body('unitCost').optional().isFloat({ min: 0 }).withMessage('El costo unitario debe ser un número positivo'),
    validateFields
];