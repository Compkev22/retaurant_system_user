'use strict';

import Billing from './billing.model.js';
import Order from '../Order/order.model.js';
import Table from '../Table/table.model.js';
import User from '../User/user.model.js';
import OrderRequest from '../OrderRequest/orderRequest.model.js';

/**
 * Obtener facturas con paginación y filtro de estado
 */
export const getBillings = async (req, res) => {
    try {
        const { page = 1, limit = 10, BillStatus } = req.query;

        const filter = {};
        if (BillStatus) filter.BillStatus = BillStatus;

        // Si el usuario es CLIENT, solo ve las suyas
        if (req.user.role === 'CLIENT') {
            filter.client = req.user._id;
        }

        const billings = await Billing.find(filter)
            .populate('Order')
            .populate('client', 'UserName UserSurname UserEmail')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ BillDate: -1 });

        const total = await Billing.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: billings,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las facturas',
            error: error.message,
        });
    }
};

/**
 * Obtener una factura por ID (con validación de dueño)
 */
export const getBillingById = async (req, res) => {
    try {
        const { id } = req.params;
        const billing = await Billing.findById(id).populate('Order client');

        if (!billing) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }

        // Seguridad: Un cliente no puede ver facturas de otros
        if (req.user.role === 'CLIENT' && billing.client._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta factura' });
        }

        res.status(200).json({ success: true, data: billing });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la factura', error: error.message });
    }
};

