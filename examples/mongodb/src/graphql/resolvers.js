export default {
  Query: {
    posts: async (parent, args, { models }) => {
      const Posts = await models.Post.find({});
      console.log(Posts);
      return Posts;
    },
  },
  Mutation: {
    createPost: async (parent, { title, desc, author }, { models }) => {
      const Post = await models.Post.findOne({ title });

      if (Post) {
        throw new Error('Please provide a unique title.');        
      }
      
      // create a new post
      const newPost = new models.Post({
        title,
        desc,
        author
      });

      // save the post
      try {
        await newPost.save();
      } catch (e) {
        throw new Error('Cannot Save Post!!!');
      }

      return true;
    },
  },
};