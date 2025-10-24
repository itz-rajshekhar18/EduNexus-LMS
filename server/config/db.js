// server/config/db.js
const mongoose = require('mongoose');

mongoose.set('strictQuery', true); // safer query parsing
if (process.env.MONGOOSE_DEBUG === 'true' && process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true);
}

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edunexus';

const options = {
  autoIndex: true,
  maxPoolSize: parseInt(process.env.DB_MAX_POOL || '10', 10),
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 20000,
  retryWrites: true,
  w: 'majority',
};

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;
  try {
    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    throw err;
  }
}

function setupShutdown() {
  const close = async () => {
    try {
      await mongoose.connection.close();
      process.exit(0);
    } catch (e) {
      process.exit(1);
    }
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

module.exports = { connectDB, setupShutdown };
