'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const graphql_1 = require('./graphql');
const initRouter = app => {
  const { router } = app;
  (0, graphql_1.registerGraphqlRoute)(router);
};
exports.default = app => {
  initRouter(app);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsdUNBQWlEO0FBRWpELE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBbUIsRUFBRSxFQUFFO0lBQ3ZDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUM7SUFFdkIsSUFBQSw4QkFBb0IsRUFBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUM7QUFFRixrQkFBZSxDQUFDLEdBQVEsRUFBRSxFQUFFO0lBQ3hCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMifQ==
