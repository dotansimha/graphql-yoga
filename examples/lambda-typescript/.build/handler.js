"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_yoga_1 = require("graphql-yoga");
var typeDefs = "\n  type Query {\n    hello(name: String): String\n  }\n";
var resolvers = {
    Query: {
        hello: function (_, _a) {
            var name = _a.name;
            return "Hello " + (name || 'world');
        },
    },
};
var server = new graphql_yoga_1.GraphQLServerLambda({
    typeDefs: typeDefs,
    resolvers: resolvers,
});
exports.server = server.graphqlHandler;
exports.playground = server.playgroundHandler;
//# sourceMappingURL=handler.js.map