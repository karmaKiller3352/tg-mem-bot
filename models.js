const { Schema, model } = require('mongoose')

const schema = new Schema({
  id: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  authorId: {
    type: String,
    required: true
  },
  publicationMonth: {
    type: String,
    required: true
  },
  publicationYear: {
    type: String,
    required: true
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  videoId: {
    type: String,
  },
  photoId: {
    type: String,
  },
  pollId: {
    type: String,
  },
  rate: {
    type: String,
  }
})

module.exports = model('Mem', schema)
