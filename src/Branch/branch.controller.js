'use strict';

import Branch from './branch.model.js';


//Todos pueden ver
export const getBranches = async (req, res) => {
    try {
        const { zone, branchStatus } = req.query;

        const filter = {};
        filter.branchStatus = branchStatus || 'ACTIVE';

        if (zone) filter.zone = parseInt(zone);

        const branches = await Branch.find(filter).sort({ zone: 1, name: 1 });

        res.status(200).json({
            success: true,
            data: branches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//Solo PLATFORM_ADMIN
export const createBranch = async (req, res) => {
    try {
        if (req.user.role != 'PLATFORM_ADMIN') {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const data = req.body;

        if (req.file) {
            data.Photos = [{ ImgaeURL: req.file.path }];
        }

        const branch = new Branch(req.body);
        await branch.save();

        res.status(201).json({ success: true, data: branch });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

//Solo PLATFORM_ADMIN y BRANCH_ADMIN
export const updateBranch = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const data = req.body;

        if (req.file) {
            data.Photos = [{ ImgaeURL: req.file.path }];
        }

        const branch = await Branch.findByIdAndUpdate(id, req.body, { new: true });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        res.status(200).json({ success: true, data: branch });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

//Solo PLATFORM_ADMIN
export const changeBranchStatus = async (req, res) => {
    try {
        if (req.user.role !== 'PLATFORM_ADMIN') {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const branch = await Branch.findById(id);

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        branch.branchStatus =
            branch.branchStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        branch.deletedAt =
            branch.branchStatus === 'INACTIVE' ? new Date() : null;

        await branch.save();

        res.status(200).json({
            success: true,
            message: `Branch ${branch.branchStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
            data: branch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error changing branch status',
            error: error.message
        });
    }
};