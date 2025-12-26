import express from 'express';
const router = express.Router();
import {
  initiateEsewaPayment,
  verifyEsewaPayment,
} from '../controllers/esewaController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/initiate').post(protect, initiateEsewaPayment);
router.route('/verify').post(protect, verifyEsewaPayment);

export default router;
