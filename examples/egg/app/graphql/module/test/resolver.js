'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.testResolver = void 0;
const testData = [
  { id: '1', name: 'Test 1' },
  { id: '2', name: 'Test 2' },
  { id: '3', name: 'Test 3' },
];
exports.testResolver = {
  Query: {
    testList: () => {
      return {
        count: testData.length,
        data: testData,
      };
    },
  },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxNQUFNLFFBQVEsR0FBRztJQUNiLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0lBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0lBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0NBQzlCLENBQUM7QUFFVyxRQUFBLFlBQVksR0FBZTtJQUNwQyxLQUFLLEVBQUU7UUFDSCxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBQ1gsT0FBTztnQkFDSCxLQUFLLEVBQUUsUUFBUSxDQUFDLE1BQU07Z0JBQ3RCLElBQUksRUFBRSxRQUFRO2FBQ2pCLENBQUM7UUFDTixDQUFDO0tBQ0o7Q0FDSixDQUFDIn0=
