import express from 'express';
import { updateCharityNeeds, getCharityNeeds, deleteCharityNeeds } from '../controllers/charityController.js';
import { protect, charity } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/needs')
    .get(protect, charity, getCharityNeeds)
    .put(protect, charity, updateCharityNeeds)
    .delete(protect, charity, deleteCharityNeeds);

export default router;
