'use strict';

import Billing from './billing.model.js';
import Order from '../Order/order.model.js';
import OrderDetail from '../OrderDetail/orderDetail.model.js';
import Table from '../Table/table.model.js';
import User from '../User/user.model.js';
import OrderRequest from '../OrderRequest/orderRequest.model.js';
import nodemailer from 'nodemailer';

/**
 * Obtener facturas con paginación y filtro de estado
 */
export const getBillings = async (req, res) => {
    try {
        const { page = 1, limit = 10, BillStatus } = req.query;

        const filter = {};
        if (BillStatus) filter.BillStatus = BillStatus;

        if (req.user.role === 'CLIENT') {
            const userDB = await User.findOne({ authId: req.user.id });
            filter.client = userDB?._id;
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

        if (req.user.role === 'CLIENT') {
            const userDB = await User.findOne({ authId: req.user.id });
            if (!userDB || billing.client._id.toString() !== userDB._id.toString()) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta factura' });
            }
        }

        res.status(200).json({ success: true, data: billing });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la factura', error: error.message });
    }
};

/**
 * Obtener factura por ID de Orden
 */
export const getBillingByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const billing = await Billing.findOne({ Order: orderId })
            .populate('Order')
            .populate('branchId', 'name zone')
            .populate('client', 'UserName UserSurname UserEmail');

        if (!billing) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada para esta orden' });
        }

        if (req.user.role === 'CLIENT') {
            const userDB = await User.findOne({ authId: req.user.id });
            if (!userDB || billing.client._id.toString() !== userDB._id.toString()) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta factura' });
            }
        }

        res.status(200).json({ success: true, data: billing });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la factura', error: error.message });
    }
};

/**
 * Enviar factura por correo electrónico
 */
export const sendInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: 'El correo es obligatorio' });
        }

        const userDB = await User.findOne({ authId: req.user.id });
        if (!userDB) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const billing = await Billing.findOne({ Order: orderId })
            .populate('Order')
            .populate('branchId', 'name zone address')
            .populate('client', 'UserName UserSurname UserEmail');

        if (!billing) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }

        if (billing.client._id.toString() !== userDB._id.toString()) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const details = await OrderDetail.find({ order: orderId })
            .populate('productoId', 'nombre')
            .populate('comboId', 'ComboName');

        const branch = billing.branchId;
        const nit = billing.BillNIT || 'CF';
        const clientName = billing.client
            ? `${billing.client.UserName} ${billing.client.UserSurname}`
            : 'Consumidor Final';

        const rows = details.map((d, i) => {
            const name = d.productoId?.nombre || d.comboId?.ComboName || 'Item';
            const tipo = d.productoId ? 'Producto' : 'Combo';
            return `
                <tr>
                    <td style="padding:8px;border-bottom:1px solid #eee;color:#555;">${i + 1}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">
                        <strong>${name}</strong><br/>
                        <span style="font-size:11px;color:#999;">${tipo}</span>
                    </td>
                    <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${d.cantidad}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">Q ${d.precio.toFixed(2)}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">Q ${d.subtotal.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const fecha = new Date(billing.BillDate).toLocaleDateString('es-GT', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const hora = new Date(billing.BillDate).toLocaleTimeString('es-GT', {
            hour: '2-digit', minute: '2-digit'
        });

        const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;">
            <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                <div style="background:#e11d48;padding:30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">RESTAURANTE</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Factura de Venta</p>
                </div>
                <div style="padding:25px 30px;border-bottom:1px solid #f0f0f0;">
                    <table style="width:100%;font-size:13px;color:#555;">
                        <tr>
                            <td style="padding:4px 0;"><strong>Sucursal:</strong> ${branch?.name || 'N/A'} — Zona ${branch?.zone || ''}</td>
                            <td style="padding:4px 0;text-align:right;"><strong>Fecha:</strong> ${fecha}</td>
                        </tr>
                        <tr>
                            <td style="padding:4px 0;"><strong>Serie:</strong> ${billing.BillSerie}</td>
                            <td style="padding:4px 0;text-align:right;"><strong>Hora:</strong> ${hora}</td>
                        </tr>
                    </table>
                </div>
                <div style="padding:20px 30px;border-bottom:1px solid #f0f0f0;background:#fafafa;">
                    <p style="margin:0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Datos del Cliente</p>
                    <p style="margin:6px 0 0;font-size:14px;font-weight:bold;color:#333;">${clientName}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#666;">NIT: ${nit}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#666;">Correo: ${billing.BillEmail || billing.client?.UserEmail || 'N/A'}</p>
                </div>
                <div style="padding:20px 30px;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <thead>
                            <tr style="background:#f8f8f8;">
                                <th style="padding:10px 8px;text-align:left;font-size:11px;color:#999;text-transform:uppercase;">#</th>
                                <th style="padding:10px 8px;text-align:left;font-size:11px;color:#999;text-transform:uppercase;">Detalle</th>
                                <th style="padding:10px 8px;text-align:center;font-size:11px;color:#999;text-transform:uppercase;">Cant.</th>
                                <th style="padding:10px 8px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;">P. Unit.</th>
                                <th style="padding:10px 8px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div style="padding:15px 30px 25px;">
                    <table style="width:100%;font-size:13px;">
                        <tr>
                            <td style="padding:6px 0;color:#888;">Subtotal</td>
                            <td style="padding:6px 0;text-align:right;color:#555;">Q ${billing.BillSubtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0;color:#888;">IVA (12%)</td>
                            <td style="padding:6px 0;text-align:right;color:#555;">Q ${billing.BillIVA.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px 0 0;font-size:16px;font-weight:bold;color:#e11d48;border-top:2px solid #e11d48;">TOTAL</td>
                            <td style="padding:10px 0 0;text-align:right;font-size:18px;font-weight:bold;color:#e11d48;border-top:2px solid #e11d48;">Q ${billing.BillTotal.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
                <div style="background:#f8f8f8;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
                    <p style="margin:0;font-size:11px;color:#aaa;">Gracias por su compra — Restaurante App</p>
                    <p style="margin:4px 0 0;font-size:10px;color:#ccc;">Este documento es un comprobante de venta</p>
                </div>
            </div>
        </body>
        </html>`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: '"Restaurante App" <no-reply@tu-restaurante.com>',
            to: email.trim(),
            subject: `Factura ${billing.BillSerie} — Restaurante`,
            html
        });

        if (!billing.BillEmail) {
            billing.BillEmail = email.trim();
            await billing.save();
        }

        res.status(200).json({
            success: true,
            message: 'Factura enviada por correo electrónico'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al enviar la factura',
            error: error.message
        });
    }
};
