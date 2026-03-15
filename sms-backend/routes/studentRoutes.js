import { Router } from 'express';
import {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentCourses,
  assignCourseToStudent,
  removeCourseFromStudent
} from '../controllers/studentController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/',    verifyToken, getStudents);
router.post('/',   verifyToken, addStudent);

// ── Course sub-routes MUST come before /:id ──
router.get('/:id/courses',              verifyToken, getStudentCourses);
router.post('/:id/courses',             verifyToken, assignCourseToStudent);
router.delete('/:id/courses/:courseId', verifyToken, removeCourseFromStudent);

// ── These come after ──
router.get('/:id',    verifyToken, getStudentById);
router.put('/:id',    verifyToken, updateStudent);
router.delete('/:id', verifyToken, deleteStudent);

export default router;