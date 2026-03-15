// intakeRoutes.js

import { Router } from 'express';
import {
  getIntakes,
  getIntakeCount,
  getIntakeStudents,
  addIntake,
  updateIntake,
  deleteIntake,
  assignCourseToIntake,
  removeCourseFromIntake,
  getIntakeCourses
} from '../controllers/intakeController.js';

import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Intake routes
router.get('/', verifyToken, getIntakes);
router.get('/count', verifyToken, getIntakeCount);
router.post('/', verifyToken, addIntake);
router.put('/:id', verifyToken, updateIntake);
router.delete('/:id', verifyToken, deleteIntake);

// Intake relations
router.get('/:id/students', verifyToken, getIntakeStudents);
router.get('/:id/courses', verifyToken, getIntakeCourses);
router.post('/:id/courses', verifyToken, assignCourseToIntake);
router.delete('/:id/courses/:courseId', verifyToken, removeCourseFromIntake);

export default router;