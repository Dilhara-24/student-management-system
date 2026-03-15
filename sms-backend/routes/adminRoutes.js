// adminRoutes.js
import { Router } from 'express';
import { getAdmins, getAdminCount, addAdmin, updateAdmin, deleteAdmin } from '../controllers/adminController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.get('/',        verifyToken, getAdmins);
router.get('/count',   verifyToken, getAdminCount);
router.post('/',       verifyToken, addAdmin);
router.put('/:id',     verifyToken, updateAdmin);
router.delete('/:id',  verifyToken, deleteAdmin);
export default router;
