import mongoose from 'mongoose';
import Post from './post.js';

// SET UP Mongoose Promises.
mongoose.Promise = global.Promise;

export const startDB = ({ user, pwd, url, db }) => mongoose.connect(`mongodb://${user}:${pwd}@${url}/${db}`);
  
export const models = {
  Post,
}
