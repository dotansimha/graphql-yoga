const mongoose = require('mongoose');
const Post = require('./post.js');

// SET UP Mongoose Promises.
mongoose.Promise = global.Promise;

module.exports = {
  startDB: ({ user, pwd, url, db }) => 
  mongoose.connect(`mongodb://${user}:${pwd}@${url}/${db}`),
  models: {
    Post
  },
};
