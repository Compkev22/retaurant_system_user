import Combo from './combo.model.js';

// Obtener combos (Vista Cliente)
export const getCombos = async (req, res) => {
    try {

        const { page = 1, limit = 10, branchId } = req.query;

        const filter = {
            ComboStatus: 'ACTIVE',
            status: 'Disponible'
        };

        if (branchId) {
            filter['Branches.BranchId'] = branchId;
        }

        const combos = await Combo.find(filter)
            .populate('Products.ProductId', 'nombre imagen_url precio') // Solo info pública
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Combo.countDocuments(filter);

        res.status(200).json({
            success: true,
            total,
            data: combos
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener combos' });
    }
};

// Obtener detalle de UN combo
export const getComboById = async (req, res) => {
    try {
        const { id } = req.params;
        const combo = await Combo.findOne({ _id: id, ComboStatus: 'ACTIVE' })
            .populate('Products.ProductId', 'nombre descripcion imagen_url');

        if (!combo) return res.status(404).json({ success: false, message: 'Combo no disponible' });

        res.status(200).json({ success: true, data: combo });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el detalle' });
    }
};
