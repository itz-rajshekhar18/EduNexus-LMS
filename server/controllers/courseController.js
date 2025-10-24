// server/controllers/courseController.js
const mongoose = require('mongoose');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary'); // expected to export configured cloudinary.v2
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const User = require('../models/User');

function ensureObjectId(id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

async function uploadToCloudinaryFromFile(file, opts = {}) {
  if (!file) return null;
  const options = { resource_type: 'auto', ...opts };
  // If multer stored on disk with path
  if (file.path) {
    const result = await cloudinary.uploader.upload(file.path, options);
    return { url: result.secure_url, publicId: result.public_id, duration: result.duration || null };
  }
  // If multer stored in memory as buffer
  if (file.buffer) {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id, duration: result.duration || null });
      });
      Readable.from(file.buffer).pipe(upload);
    });
  }
  return null;
}

function canEditCourse(user, course) {
  if (!user || !course) return false;
  if (user.role === 'admin') return true;
  return String(course.instructor) === String(user.id || user._id);
}

exports.getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      level,
      instructor,
      isPublished,
      q,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (instructor) filter.instructor = instructor;
    if (typeof isPublished !== 'undefined') filter.isPublished = isPublished === 'true';
    if (q) {
      filter.$text = { $search: q };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = Course.find(filter)
      .select('title thumbnailUrl category level language price isPublished ratingAverage ratingCount instructor createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'instructor', select: 'name email avatarUrl role' })
      .lean();

    const [items, total] = await Promise.all([
      query,
      Course.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({ path: 'instructor', select: 'name email avatarUrl role' })
      .populate({ path: 'lectures', select: 'title durationSec order isPreview createdAt' })
      .populate({ path: 'assignments', select: 'title dueDate maxScore createdAt' })
      .lean();

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    return res.json({ success: true, data: course });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, level, language, price, thumbnailUrl, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }

    const course = await Course.create({
      title,
      description,
      category,
      level,
      language,
      price,
      thumbnailUrl,
      tags,
      instructor: ensureObjectId(req.user.id || req.user._id),
    });

    // Track teachingCourses for instructor
    await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      { $addToSet: { teachingCourses: course._id } },
      { new: false }
    );

    return res.status(201).json({ success: true, data: course });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (!canEditCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const allowed = [
      'title',
      'description',
      'category',
      'level',
      'language',
      'price',
      'thumbnailUrl',
      'tags',
    ];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }

    Object.assign(course, updates);
    await course.save();

    return res.json({ success: true, data: course });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (!canEditCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Lecture.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(course._id);

    // Remove from instructor.teachingCourses
    await User.updateMany(
      { teachingCourses: course._id },
      { $pull: { teachingCourses: course._id } }
    );

    return res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.enrollInCourse = async (req, res) => {
  try {
    const courseId = ensureObjectId(req.params.id);
    const userId = ensureObjectId(req.user.id || req.user._id);

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    await Promise.all([
      Course.findByIdAndUpdate(courseId, { $addToSet: { students: userId } }),
      User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } }),
    ]);

    return res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.togglePublishCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (!canEditCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    course.isPublished = !course.isPublished;
    await course.save();

    return res.json({ success: true, data: { _id: course._id, isPublished: course.isPublished } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.addLecture = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (!canEditCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { title, description = '', order = 1, isPreview = false, resources = [] } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    let videoUrl = '';
    let videoPublicId = null;
    let durationSec = 0;

    if (req.file) {
      const uploaded = await uploadToCloudinaryFromFile(req.file, {
        folder: process.env.CLOUDINARY_LECTURES_FOLDER || 'edunexus/lectures',
        resource_type: 'video',
      });
      if (uploaded) {
        videoUrl = uploaded.url;
        videoPublicId = uploaded.publicId;
        durationSec = Math.round(uploaded.duration || 0);
      }
    }

    const lecture = await Lecture.create({
      course: course._id,
      title,
      description,
      videoUrl,
      videoPublicId,
      durationSec,
      order: Number(order) || 1,
      isPreview: Boolean(isPreview),
      resources: Array.isArray(resources) ? resources : [],
    });

    await Course.findByIdAndUpdate(course._id, { $addToSet: { lectures: lecture._id } });

    return res.status(201).json({ success: true, data: lecture });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (!canEditCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const allowed = ['title', 'description', 'order', 'isPreview', 'resources'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }

    const lecture = await Lecture.findOneAndUpdate(
      { _id: lectureId, course: courseId },
      { $set: updates },
      { new: true }
    );

    if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });
    return res.json({ success: true, data: lecture });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (!canEditCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const lecture = await Lecture.findOneAndDelete({ _id: lectureId, course: courseId });
    if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });

    await Course.findByIdAndUpdate(courseId, { $pull: { lectures: lectureId } });

    // Optional: delete video from Cloudinary if present
    if (lecture.videoPublicId) {
      try {
        await cloudinary.uploader.destroy(lecture.videoPublicId, { resource_type: 'video' });
      } catch (e) {
        // Swallow cleanup errors
      }
    }

    return res.json({ success: true, message: 'Lecture deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
