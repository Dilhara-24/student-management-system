// logRoutes.js
import { Router } from 'express';
import { getLogs } from '../controllers/logController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.get('/', verifyToken, getLogs);
export default router;
