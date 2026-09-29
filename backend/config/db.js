const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  const defaultUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alumnicrm';

  // 1. If explicit MONGO_URI provided and not 'memory', attempt connection
  if (process.env.MONGO_URI && process.env.MONGO_URI !== 'memory') {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected (Primary URI): ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.log(`Primary MONGO_URI failed (${err.message}). Attempting MongoMemoryServer fallback...`);
    }
  }

  // 2. Attempt MongoMemoryServer for zero-config execution
  try {
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`InMemory MongoMemoryServer started & connected: ${memoryUri}`);
    return conn;
  } catch (memErr) {
    console.log(`MongoMemoryServer initialization note (${memErr.message}).`);
    console.log(`Falling back to local MongoDB daemon URI: ${defaultUri}`);

    // 3. Fallback to standard local MongoDB URI
    try {
      const conn = await mongoose.connect(defaultUri);
      console.log(`MongoDB Connected (Local Daemon): ${conn.connection.host}`);
      return conn;
    } catch (localErr) {
      console.error(`Unable to establish MongoDB connection: ${localErr.message}`);
      console.log('Hint: Ensure MongoDB is running locally or specify MONGO_URI in backend/.env file.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
