'use strict';

import Review from './review.model.js';
import Order from '../Order/order.model.js';
import OrderRequest from '../OrderRequest/orderRequest.model.js';

/* -----------------------------------------
   CREAR RESEÑA
------------------------------------------*/
export const createReview = async (req, res) => {
    try {
        const { orderRequestId, rating, comment } = req.body;
        const customerId = req.user._id;

        // BUSCAR el pedido (No crearlo)
        const orderReq = await OrderRequest.findById(orderRequestId);

        if (!orderReq) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud de pedido no encontrada'
            });
        }

        // Validar dueño
        if (orderReq.customer.toString() !== customerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'No puedes reseñar un pedido que no realizaste tú'
            });
        }

        // Validar estado
        if (orderReq.orderStatus !== 'Entregado') {
            return res.status(400).json({
                success: false,
                message: 'Solo puedes reseñar pedidos entregados'
            });
        }

        // CREAR la RESEÑA (Aquí es donde se usa Review.create)
        const review = await Review.create({
            customer: customerId,
            order: orderReq.order, 
            branch: orderReq.branch,
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            message: 'Reseña creada exitosamente',
            data: review
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya has dejado una reseña para este pedido'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al procesar la reseña',
            error: error.message
        });
    }
};

/* -----------------------------------------
   OBTENER RESEÑAS DEL CLIENTE
------------------------------------------*/
export const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            customer: req.user._id,
            isDeleted: false
        })
            .populate('order', 'estado total')
            .populate('branch', 'name');

        res.status(200).json({
            success: true,
            data: reviews
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener reseñas',
            error: error.message
        });
    }
};


/* -----------------------------------------
   OBTENER RESEÑAS POR SUCURSAL
------------------------------------------*/
export const getBranchReviews = async (req, res) => {
    try {
        const { branchId } = req.params;

        const reviews = await Review.find({
            branch: branchId,
            isDeleted: false
        })
            .populate('customer', 'UserName UserSurname')
            .populate('order', 'estado total')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: reviews
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener reseñas de la sucursal',
            error: error.message
        });
    }
};


/* -----------------------------------------
   ACTUALIZAR RESEÑA
------------------------------------------*/
export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const review = await Review.findOne({
            _id: id,
            customer: req.user._id,
            isDeleted: false
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Reseña no encontrada'
            });
        }

        review.rating = rating ?? review.rating;
        review.comment = comment ?? review.comment;

        await review.save();

        res.status(200).json({
            success: true,
            message: 'Reseña actualizada',
            data: review
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar reseña',
            error: error.message
        });
    }
};


/* -----------------------------------------
   ELIMINAR RESEÑA (SOFT DELETE)
------------------------------------------*/
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userId = req.user._id;

        // Buscamos la reseña
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Reseña no encontrada'
            });
        }

        // Lógica de Permisos 
        const isPlatformAdmin = userRole === 'PLATFORM_ADMIN';
        const isBranchAdmin = (userRole === 'BRANCH_ADMIN' && review.branch?.toString() === req.user.branchId?.toString());
        const isOwner = review.customer.toString() === userId.toString();

        if (!isPlatformAdmin && !isBranchAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar el estado de esta reseña'
            });
        }

        review.isDeleted = !review.isDeleted;
        
        await review.save();

        // 4. Respuesta dinámica según el nuevo estado
        const statusMessage = review.isDeleted ? 'eliminada (Soft Delete)' : 'restaurada con éxito';

        res.status(200).json({
            success: true,
            message: `Reseña ${statusMessage} por ${userRole}`,
            data: {
                id: review._id,
                isDeleted: review.isDeleted
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al procesar el cambio de estado de la reseña',
            error: error.message
        });
    }
};