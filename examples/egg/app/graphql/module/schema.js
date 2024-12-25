'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.schema = void 0;
const graphql_yoga_1 = require('graphql-yoga');
const schema_1 = require('./test/schema');
const resolver_1 = require('./test/resolver');
exports.schema = (0, graphql_yoga_1.createSchema)({
  typeDefs: [schema_1.testTypeDefs],
  resolvers: [resolver_1.testResolver],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtDQUEyQztBQUMzQywwQ0FBNkM7QUFDN0MsOENBQStDO0FBRWxDLFFBQUEsTUFBTSxHQUFHLElBQUEsMkJBQVksRUFBQztJQUMvQixRQUFRLEVBQUUsQ0FBQyxxQkFBWSxDQUFDO0lBQ3hCLFNBQVMsRUFBRSxDQUFDLHVCQUFZLENBQUM7Q0FDNUIsQ0FBQyxDQUFDIn0=
