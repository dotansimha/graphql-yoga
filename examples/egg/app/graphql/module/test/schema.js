'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.testTypeDefs = void 0;
exports.testTypeDefs = `#graphql

type Test {
    id: String

    name: String
}

type TestList {
    count: Int
    data: [Test]
}

type Query {
    testList: TestList
}
`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFhLFFBQUEsWUFBWSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7O0NBZ0IzQixDQUFDIn0=
