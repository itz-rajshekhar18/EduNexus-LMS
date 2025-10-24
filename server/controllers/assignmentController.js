// server/controllers/assignmentController.js
const { Readable } = require('stream');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');

async function uploadToCloudinaryFromFile(file, opts = {}) {
  if (!file) return null;
  const options = { resource_type: 'auto', ...opts };
  if (file.path) {
    const result = await cloudinary.uploader.upload(file.path, options);
    return { url: result.secure_url, publicId: result.public_id };
  }
  if (file.buffer) {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      });
      Readable.from(file.buffer).pipe(upload);
    });
  }
  return null;
}

async function uploadMany(files, folder, resource_type = 'auto') {
  if (!files || !files.length) return [];
  const uploaded = [];
  for (const f of files) {
    const u = await uploadToCloudinaryFromFile(f, { folder, resource_type });
    if (u) {
      uploaded.push({
        url: u.url,
        publicId: u.publicId,
        filename: f.originalname || '',
        type: 'file',
      });
    }
  }
  return uploaded;
}

exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const assignments = await Assignment.find({ course: courseId })
      .select('title description dueDate maxScore createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: assignments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Only course instructor or admin
    const isInstructor = String(course.instructor) === String(req.user.id || req.user._id);
    if (!(req.user.role === 'admin' || isInstructor)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { title, description, dueDate, maxScore } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }

    let attachments = [];
    if (req.files && req.files.length) {
      attachments = await uploadMany(
        req.files,
        process.env.CLOUDINARY_ASSIGNMENTS_FOLDER || 'edunexus/assignments',
        'auto'
      );
    }

    const assignment = await Assignment.create({
      course: course._id,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      maxScore: maxScore ? Number(maxScore) : 100,
      attachments,
      createdBy: req.user.id || req.user._id,
    });

    await Course.findByIdAndUpdate(course._id, { $addToSet: { assignments: assignment._id } });

    return res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId)
      .populate({ path: 'course', select: 'title instructor' })
      .lean();

    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    return res.json({ success: true, data: assignment });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const { textAnswer = '' } = req.body;
    const studentId = req.user.id || req.user._id;

    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    let files = [];
    if (req.files && req.files.length) {
      const uploaded = await uploadMany(
        req.files,
        process.env.CLOUDINARY_SUBMISSIONS_FOLDER || 'edunexus/submissions',
        'auto'
      );
      files = uploaded;
    }

    // Upsert: one submission per student per assignment
    const submission = await Submission.findOne({ assignment: assignmentId, student: studentId });

    if (!submission) {
      const created = await Submission.create({
        assignment: assignmentId,
        student: studentId,
        files,
        textAnswer,
        submittedAt: new Date(),
        status: 'submitted',
      });
      return res.status(201).json({ success: true, data: created });
    } else {
      submission.files = files.length ? files : submission.files;
      submission.textAnswer = textAnswer ?? submission.textAnswer;
      submission.submittedAt = new Date();
      submission.status = 'resubmitted';
      await submission.save();
      return res.json({ success: true, data: submission });
    }
  } catch (err) {
    // Handle unique index errors gracefully
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Submission already exists' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSubmissionsByAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate({ path: 'student', select: 'name email avatarUrl' })
      .sort({ submittedAt: -1 })
      .lean();

    return res.json({ success: true, data: submissions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    // Optional: Only course instructor/admin could grade; add stronger checks by joining assignment->course if needed
    sub.grade = grade != null ? Number(grade) : sub.grade;
    sub.feedback = feedback ?? sub.feedback;
    sub.gradedBy = req.user.id || req.user._id;
    sub.status = 'graded';
    await sub.save();

    return res.json({ success: true, data: sub });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
