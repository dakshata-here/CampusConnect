import mongoose from 'mongoose';

export const connectDB = async (uri?: string): Promise<void> => {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB Disconnected');
  } catch (error) {
    console.error('[Database] MongoDB disconnection error:', error);
    throw error;
  }
};
