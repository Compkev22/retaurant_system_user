import Combo from './combo.model.js';
import Product from '../Product/product.model.js';

// Obtener combos (filtra ACTIVE por defecto)
// TODOS PUEDEN VER
export const getCombos = async (req, res) => {
    try {
        const { page = 1, limit = 10, ComboStatus } = req.query;

        const filter = {};

        if (req.user.role === 'CLIENT') {
            filter.ComboStatus = 'ACTIVE';
        }

        const combos = await Combo.find(filter)
            .populate({
                path: 'ComboList.productId',
                select: 'nombre precio categoria estado'
            })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Combo.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: combos,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                limit: parseInt(limit),
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los combos',
            error: error.message,
        });
    }
};

// Obtener combo por ID 
export const getComboById = async (req, res) => {
    try {
        const { id } = req.params;

        const combo = await Combo.findById(id).populate({
            path: 'ComboList.productId',
            select: 'nombre precio categoria imagen_url estado'
        });

        if (!combo) {
            return res.status(404).json({
                success: false,
                message: 'Combo no encontrado',
            });
        }

        if (req.user.role === 'CLIENT' && combo.ComboStatus !== 'ACTIVE') {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        res.status(200).json({
            success: true,
            data: combo,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el combo',
            error: error.message,
        });
    }
};

// Crear combo
// PLATFORM_ADMIN Y BRANCH_ADMIN
export const createCombo = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const comboData = req.body;

        if (comboData.ComboList && comboData.ComboList.length > 0) {
            for (const item of comboData.ComboList) {
                const productExists = await Product.findById(item.productId);
                if (!productExists) {
                    return res.status(404).json({
                        success: false,
                        message: `El producto con ID ${item.productId} no existe`,
                    });
                }
            }
        }

        const combo = new Combo(comboData);
        await combo.save();

        res.status(201).json({
            success: true,
            message: 'Combo creado exitosamente',
            data: combo,
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el combo',
            error: error.message,
        });
    }
};

// Actualizar combo
// PLATFORM_ADMIN y BRANCH_ADMIN
export const updateCombo = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }


        const { id } = req.params;
        const data = req.body;

        if (data.ComboList && Array.isArray(data.ComboList)) {

            if (data.ComboList.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El combo no puede quedarse sin productos'
                });
            }

            for (const item of data.ComboList) {
                const productExists = await Product.findById(item.productId);
                if (!productExists) {
                    return res.status(404).json({
                        success: false,
                        message: `El producto con ID ${item.productId} no existe`
                    });
                }
            }
        }

        const combo = await Combo.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).populate('ComboList.productId', 'nombre precio');

        if (!combo) {
            return res.status(404).json({
                success: false,
                message: 'Combo no encontrado',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Combo actualizado y validado exitosamente',
            data: combo,
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el combo',
            error: error.message,
        });
    }
};

// PLATFORM_ADMIN, BRANCH_ADMIN y EMPLOYEE
export const changeComboStatus = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;

        const combo = await Combo.findById(id);

        if (!combo) {
            return res.status(404).json({
                success: false,
                message: 'Combo no encontrado',
            });
        }

        combo.ComboStatus =
            combo.ComboStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        combo.deletedAt =
            combo.ComboStatus === 'INACTIVE' ? new Date() : null;

        await combo.save();

        res.status(200).json({
            success: true,
            message: `Combo ${combo.ComboStatus === 'ACTIVE' ? 'activado' : 'desactivado'} exitosamente`,
            data: combo,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado del combo',
            error: error.message,
        });
    }
};