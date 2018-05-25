const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  desc: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Post', PostSchema);
