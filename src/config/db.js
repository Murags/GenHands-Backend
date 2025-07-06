import mongoose from 'mongoose';
// dotenv/config is preloaded via the npm script

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
    console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
