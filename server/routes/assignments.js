// server/routes/assignments.js
const express = require('express');
const router = express.Router();

const assignmentController = require('../controllers/assignmentController');
const { verifyJWT } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');
const { upload } = require('../middleware/upload');

// List assignments for a course (public or protected per your policy)
router.get('/course/:courseId', assignmentController.getAssignmentsByCourse);

// Create assignment for a course (instructors/admin)
router.post(
  '/course/:courseId',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  upload.array('attachments', 10), // expects "attachments"[] files
  assignmentController.createAssignment
);

// Get assignment by ID
router.get('/:assignmentId', assignmentController.getAssignmentById);

// Submit an assignment (students)
router.post(
  '/:assignmentId/submissions',
  verifyJWT,
  upload.array('files', 10), // expects "files"[] for submission
  assignmentController.submitAssignment
);

// Get all submissions for an assignment (instructors/admin)
router.get(
  '/:assignmentId/submissions',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  assignmentController.getSubmissionsByAssignment
);

// Grade a submission (instructors/admin)
router.patch(
  '/submissions/:submissionId/grade',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  assignmentController.gradeSubmission
);

module.exports = router;
