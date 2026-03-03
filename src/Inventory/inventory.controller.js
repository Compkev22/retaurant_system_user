import Inventory from './inventory.model.js';

export const saveInventory = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }
        const data = req.body;
        const inventory = new Inventory(data);
        await inventory.save();
        return res.status(201).send({ success: true, message: 'Insumo guardado', inventory });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al guardar', err });
    }
};

export const getInventory = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }
        const items = await Inventory.find();
        return res.send({ success: true, items });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al obtener inventario' });
    }
};
// EDITAR un insumo
export const updateInventory = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }
        const { id } = req.params; // Extraemos el ID de la URL
        const data = req.body;
        // Buscamos por ID y actualizamos con la nueva data
        const updatedItem = await Inventory.findByIdAndUpdate(id, data, { new: true });
        
        if (!updatedItem) return res.status(404).send({ success: false, message: 'Insumo no encontrado' });

        return res.send({ success: true, message: 'Insumo actualizado', updatedItem });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al actualizar', err: err.message });
    }
};
// ELIMINAR un insumo (Soft Delete)
export const deleteInventory = async (req, res) => {
    try {
        if (req.user.role !== 'PLATFORM_ADMIN') {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }
        
        const { id } = req.params;
        const item = await Inventory.findById(id);

        if (!item) return res.status(404).send({ success: false, message: 'Insumo no encontrado' });

        // LÓGICA REVERSIBLE:
        // Si es ACTIVE lo pasamos a INACTIVE, si es INACTIVE lo pasamos a ACTIVE
        const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const deletionDate = newStatus === 'INACTIVE' ? new Date() : null;

        const updatedItem = await Inventory.findByIdAndUpdate(
            id, 
            { 
                status: newStatus, 
                deletedAt: deletionDate 
            }, 
            { new: true }
        );

        return res.send({ 
            success: true, 
            message: `Insumo marcado como ${newStatus}`,
            updatedItem 
        });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error', err: err.message });
    }
};
