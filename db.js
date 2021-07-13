const mongoose = require('mongoose')
require('dotenv').config();

const uri = process.env.MONGO_URL;

async function connectDb() {
  try {
    await mongoose.connect(
      uri,
      {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
      }
    )
    console.log('Database connected')
  } catch (e) {
    console.log('Database connection failed')
  }
}

module.exports = { connectDb }