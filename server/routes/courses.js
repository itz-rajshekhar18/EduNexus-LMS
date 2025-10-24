// server/routes/courses.js
const express = require('express');
const router = express.Router();

const courseController = require('../controllers/courseController');
const { verifyJWT } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');
const { upload } = require('../middleware/upload');

// Public listings
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);

// Create a course (instructors/admin)
router.post(
  '/',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  courseController.createCourse
);

// Update a course (instructors/admin)
router.patch(
  '/:id',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  courseController.updateCourse
);

// Delete a course (instructors/admin)
router.delete(
  '/:id',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  courseController.deleteCourse
);

// Enroll into a course (students)
router.post('/:id/enroll', verifyJWT, courseController.enrollInCourse);

// Publish/unpublish course (instructors/admin)
router.post(
  '/:id/publish',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  courseController.togglePublishCourse
);

// Add a lecture (optional video upload)
router.post(
  '/:id/lectures',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  upload.single('video'), // expects field "video"
  courseController.addLecture
);

// Update a lecture
router.patch(
  '/:courseId/lectures/:lectureId',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  courseController.updateLecture
);

// Delete a lecture
router.delete(
  '/:courseId/lectures/:lectureId',
  verifyJWT,
  allowRoles('instructor', 'admin'),
  courseController.deleteLecture
);

module.exports = router;
