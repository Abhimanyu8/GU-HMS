
import { MongoClient } from 'mongodb';

export async function checkMongoConnection(): Promise<boolean> {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/guhospital';
    const client = new MongoClient(mongoUrl);
    await client.connect();
    await client.db().admin().ping();
    await client.close();
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
}
