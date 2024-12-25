'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.registerGraphqlRoute = void 0;
const handler_1 = require('./handler');
const registerGraphqlRoute = route => {
  route.all('/graphql', handler_1.graphqlHandler);
};
exports.registerGraphqlRoute = registerGraphqlRoute;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1Q0FBMkM7QUFHcEMsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFO0lBQ2xELEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLHdCQUFjLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUM7QUFGVyxRQUFBLG9CQUFvQix3QkFFL0IifQ==
