export default {
  Query: {
    welcome: (_, { yourNickname }) => `Welcome, ${yourNickname || "here"}!`
  }
};
