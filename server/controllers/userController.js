// server/controllers/userController.js
const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      q,
      isVerified,
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (typeof isVerified !== 'undefined') filter.isVerified = isVerified === 'true';
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      User.find(filter)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter),
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

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'avatarUrl', 'role', 'isVerified'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    )
      .select('-password -__v')
      .lean();

    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
