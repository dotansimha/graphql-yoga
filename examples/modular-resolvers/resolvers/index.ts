import * as path from "path";
import { mergeResolvers, fileLoader } from "merge-graphql-schemas";

/* MANUAL APPROACH: Update this file manually with each resolver file */
// import userResolvers from "./user.resolvers";
// import welcomeResolvers from "./welcome.resolvers";
// const resolversArray = [userResolvers, welcomeResolvers];

/*  AUTOMATED APPROACH: Put your resolvers anywhere 
    with ".resolvers.[js/ts]" naming convention */
const resolversArray = fileLoader(path.join(__dirname, "./**/*.resolvers.*"));

const resolvers = mergeResolvers(resolversArray);

export default resolvers;
