// courseRoutes.js
import { Router } from 'express';
import { getCourses, getCourseCount, addCourse, updateCourse, deleteCourse, getCourseIntakes } from '../controllers/courseController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.get('/',            verifyToken, getCourses);
router.get('/count',       verifyToken, getCourseCount);
router.get('/:id/intakes', verifyToken, getCourseIntakes);
router.post('/',           verifyToken, addCourse);
router.put('/:id',         verifyToken, updateCourse);
router.delete('/:id',      verifyToken, deleteCourse);
export default router;
