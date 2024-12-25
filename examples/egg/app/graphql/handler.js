'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.graphqlHandler = void 0;
const graphql_yoga_1 = require('graphql-yoga');
const schema_1 = require('./module/schema');
const yoga = (0, graphql_yoga_1.createYoga)({
  schema: schema_1.schema,
});
const graphqlHandler = async ctx => {
  const response = await yoga.handleNodeRequestAndResponse(ctx.request, ctx.res, ctx);
  // Set status code
  ctx.status = response.status;
  // Set headers
  for (const [key, value] of response.headers.entries()) {
    ctx.append(key, value);
  }
  ctx.body = response.body;
};
exports.graphqlHandler = graphqlHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0NBQTBDO0FBQzFDLDRDQUF5QztBQUd6QyxNQUFNLElBQUksR0FBRyxJQUFBLHlCQUFVLEVBQVU7SUFDN0IsTUFBTSxFQUFOLGVBQU07Q0FDVCxDQUFDLENBQUM7QUFFSSxNQUFNLGNBQWMsR0FBRyxLQUFLLEVBQUUsR0FBWSxFQUFFLEVBQUU7SUFDakQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3BGLGtCQUFrQjtJQUNsQixHQUFHLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFFN0IsY0FBYztJQUNkLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7UUFDcEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELEdBQUcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztBQUM3QixDQUFDLENBQUM7QUFYVyxRQUFBLGNBQWMsa0JBV3pCIn0=
