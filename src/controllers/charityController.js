import { Charity } from '../models/User.js';
import Category from '../models/Category.js';

/**
 * @swagger
 * tags:
 *   name: Charity Management
 *   description: Endpoints for charities to manage their profile and needs
 *
 * components:
 *   schemas:
 *     CharityNeedsRequest:
 *       type: object
 *       properties:
 *         neededCategories:
 *           type: array
 *           items:
 *             type: string
 *             description: The MongoDB ObjectId of a category.
 *           example: ["60d5f3f5e7b3c2a4e8f3b0e1", "60d5f3f5e7b3c2a4e8f3b0e2"]
 *           description: An array of Category ObjectIds that the charity needs.
 *         needsStatement:
 *           type: string
 *           maxLength: 1000
 *           example: "We are currently in urgent need of winter clothing and non-perishable food items for the upcoming cold season."
 *           description: A descriptive statement about the charity's current needs.
 *     CharityNeedsResponse:
 *       type: object
 *       properties:
 *         neededCategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *         needsStatement:
 *           type: string
 */

// @desc    Update the needs of a charity
// @route   PUT /api/charity/needs
// @access  Private/Charity
export const updateCharityNeeds = async (req, res) => {
    try {
        const { neededCategories, needsStatement } = req.body;

        const charity = await Charity.findById(req.user._id);

        if (!charity) {
            return res.status(404).json({ success: false, message: 'Charity profile not found.' });
        }

        // Validate that the provided category IDs exist
        if (neededCategories && neededCategories.length > 0) {
            const categories = await Category.find({ '_id': { $in: neededCategories } });
            if (categories.length !== neededCategories.length) {
                return res.status(400).json({ success: false, message: 'One or more provided categories are invalid.' });
            }
        }

        charity.neededCategories = neededCategories || [];
        charity.needsStatement = needsStatement || '';

        await charity.save();

        res.json({
            success: true,
            message: 'Your charity needs have been updated successfully.',
            data: {
                neededCategories: charity.neededCategories,
                needsStatement: charity.needsStatement,
            },
        });

    } catch (error) {
        console.error('Error updating charity needs:', error);
        res.status(500).json({ success: false, message: 'Server error while updating needs.' });
    }
};

// @desc    Get the needs of a charity
// @route   GET /api/charity/needs
// @access  Private/Charity
export const getCharityNeeds = async (req, res) => {
    try {
        const charity = await Charity.findById(req.user._id).populate('neededCategories', 'name description');

        if (!charity) {
            return res.status(200).json({
                success: true,
                message: 'Charity profile not found.',
                data: {
                    neededCategories: [],
                    needsStatement: ''
                }
            });
        }

        res.json({
            success: true,
            data: {
                neededCategories: charity.neededCategories || [],
                needsStatement: charity.needsStatement || '',
            },
        });
    } catch (error) {
        console.error('Error fetching charity needs:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching needs.' });
    }
};

// @desc    Delete/clear the needs of a charity
// @route   DELETE /api/charity/needs
// @access  Private/Charity
export const deleteCharityNeeds = async (req, res) => {
    try {
        const charity = await Charity.findById(req.user._id);

        if (!charity) {
            return res.status(404).json({ success: false, message: 'Charity profile not found.' });
        }

        charity.neededCategories = [];
        charity.needsStatement = '';

        await charity.save();

        res.json({
            success: true,
            message: 'Your charity needs have been cleared successfully.',
        });
    } catch (error) {
        console.error('Error deleting charity needs:', error);
        res.status(500).json({ success: false, message: 'Server error while clearing needs.' });
    }
};
