const mongoose = require('mongoose')
const uri = "mongodb+srv://rest_api:2QK5CWv8zZuZMq5@cluster0.cg8tf.mongodb.net/mems?retryWrites=true&w=majority";

async function connectDb() {
  try {
    await mongoose.connect(
      uri,
      {
        useNewUrlParser: true,
        useFindAndModify: false
      }
    )
    console.log('Database connected')
  } catch (e) {
    console.log('Database connection failed')
  }
}

module.exports = { connectDb }