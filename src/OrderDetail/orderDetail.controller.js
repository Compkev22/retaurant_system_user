'use strict';

import Order from '../Order/order.model.js';
import OrderDetail from './orderDetail.model.js';
import Product from '../Product/product.model.js';
import Combo from '../Combo/combo.model.js';
import Inventory from '../Inventory/inventory.model.js';
import OrderRequest from '../OrderRequest/orderRequest.model.js';
import User from '../User/user.model.js';

export const getOrderDetailsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        }

        if (req.user.role === 'CLIENT') {
            const userDB = await User.findOne({ authId: req.user.id });
            if (!userDB) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }
            const orderRequest = await OrderRequest.findOne({ order: orderId, customer: userDB._id });
            if (!orderRequest) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }
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


