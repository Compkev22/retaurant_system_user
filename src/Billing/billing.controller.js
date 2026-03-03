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

/**
 * Crear factura (Basado en tu lógica de IVA)
 */
export const createBilling = async (req, res) => {
    try {
        const { 
            Order: orderId, 
            BillPaymentMethod, 
            BillSerie,
            clientId,        
            newClientData   
        } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

        // Evitar duplicados
        const existing = await Billing.findOne({ Order: orderId });
        if (existing) return res.status(400).json({ success: false, message: 'Esta orden ya fue facturada' });

        let finalClientId = clientId;

        // Lógica para determinar el cliente
        if (!clientId && newClientData) {
            // Caso: Crear cliente nuevo desde la factura
            const userExists = await User.findOne({ UserEmail: newClientData.UserEmail.toLowerCase() });
            
            if (userExists) {
                finalClientId = userExists._id;
            } else {
                // Crear usuario rápido (puedes ponerle una password genérica o vacía)
                const newUser = await User.create({
                    ...newClientData,
                    password: 'Password123!', // Password por defecto o aleatoria
                    role: 'CLIENT'
                });
                finalClientId = newUser._id;
            }
        }

        if (!finalClientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Debe proporcionar un clientId o datos para crear uno (newClientData)' 
            });
        }

        // Cálculos de IVA
        const total = order.total;
        const subtotal = total / 1.12;
        const iva = total - subtotal;

        const billing = await Billing.create({
            branchId: order.branchId,
            client: finalClientId,
            Order: orderId,
            BillSerie: BillSerie || `FAC-${Date.now()}`,
            BillSubtotal: subtotal.toFixed(2),
            BillIVA: iva.toFixed(2),
            BillTotal: total.toFixed(2),
            BillPaymentMethod,
            BillStatus: 'GENERATED',
            BillDate: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Factura generada y cliente asignado',
            data: billing,
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al crear la factura', error: error.message });
    }
};

/**
 * Pagar factura y liberar mesa
 */
export const payBilling = async (req, res) => {
    try {
        const { id } = req.params;

        const billing = await Billing.findById(id).populate('Order');
        if (!billing) return res.status(404).json({ success: false, message: 'Factura no encontrada' });

        if (billing.BillStatus === 'PAYED') {
            return res.status(400).json({ success: false, message: 'La factura ya fue pagada' });
        }

        const order = await Order.findById(billing.Order._id);
        
        // Liberar mesa si existe
        if (order && order.mesaId) {
            const table = await Table.findById(order.mesaId);
            if (table) {
                table.availability = 'Disponible';
                await table.save();
            }
        }

        // Actualizar estados
        billing.BillStatus = 'PAYED';
        await billing.save();

        if (order) {
            order.estado = 'Entregado';
            await order.save();
            
            // Sincronizar con OrderRequest si aplica
            await OrderRequest.findOneAndUpdate({ order: order._id }, { orderStatus: 'Entregado' });
        }

        res.status(200).json({
            success: true,
            message: 'Factura pagada, mesa liberada y orden entregada',
            data: billing
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al procesar el pago', error: error.message });
    }
};