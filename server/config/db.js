const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/janupkram_portal';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    // Some local ISP/Windows DNS servers refuse SRV queries for mongodb+srv://
    if (uri.startsWith('mongodb+srv://') && /querySrv|ESERVFAIL|ECONNREFUSED|ETIMEOUT/i.test(err.message)) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB connected (DNS fallback): ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      } catch (retryErr) {
        console.error('MongoDB connection error (after DNS fallback):', retryErr.message);
        process.exit(1);
      }
    }
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
