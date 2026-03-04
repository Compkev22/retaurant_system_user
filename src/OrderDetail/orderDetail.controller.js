'use strict';

import Order from '../Order/order.model.js';
import OrderDetail from './orderDetail.model.js';
import Product from '../Product/product.model.js';
import Combo from '../Combo/combo.model.js';
import Inventory from '../Inventory/inventory.model.js';



export const getOrderDetailsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (req.user.role === 'CLIENT') {
            if (order.clientId?.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }
        } else if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }


        const details = await OrderDetail.find({ order: orderId })
            .populate('productoId')
            .populate('comboId')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: details
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener items',
            error: error.message
        });
    }
};


