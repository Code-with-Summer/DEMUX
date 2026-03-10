import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);


dotenv.config();

export function connectDB() {
  return mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
}
