'use strict';

import Table from './table.model.js';

// SOLO PLATFORM_ADMIN
export const saveTable = async (req, res) => {
    try {
        if (req.user.role !== 'PLATFORM_ADMIN') {
            return res.status(403).json({ success: false, message: 'No autorizado' })
        }

        const data = req.body;
        const table = new Table(data);
        await table.save();
        return res.status(201).send({ success: true, message: 'Mesa registrada', table });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al registrar mesa', err: err.message });
    }
};

//Todos pueden ver todas las mesa
export const getTables = async (req, res) => {
    try {
        const filter = {};

        if (req.user.role === 'CLIENT') {
            filter.TableStatus = 'ACTIVE';
        } else {
            if (req.query.TableStatus) {
                filter.TableStatus = req.query.TableStatus;
            }
        }

        const tables = await Table.find(filter).populate('branchId', 'nombre');
        return res.send({ success: true, tables });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al obtener mesas' });
    }
};

// PLATFORM_ADMIN Y BRANCH_ADMIN
export const updateTable = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const data = req.body;
        const updated = await Table.findByIdAndUpdate(id, data, { new: true });
        if (!updated) return res.status(404).send({ success: false, message: 'Mesa no encontrada' });
        return res.send({ success: true, message: 'Mesa actualizada', updated });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al actualizar', err: err.message });
    }
};

//PLATFORM_ADMIN, BRANCH_ADMIN Y EMPLOYEE
export const changeTableStatus = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const table = await Table.findById(id);

        if (!table) return res.status(404).send({ success: false, message: 'Mesa no encontrada' });

        // Lógica de Soft Delete igual a las otras entidades
        table.TableStatus = table.TableStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        table.deletedAt = table.TableStatus === 'INACTIVE' ? new Date() : null;

        await table.save();

        return res.send({
            success: true,
            message: `Estado de mesa cambiado a ${table.TableStatus}`,
            table
        });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al cambiar estado', err: err.message });
    }
};