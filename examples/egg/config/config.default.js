'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = app => {
  return {
    keys: app.name + 'e_ege',
    security: {
      csrf: {
        enable: false,
      },
    },
    cors: {
      origin: '*',
      allowMethods: 'GET,PUT,POST,DELETE',
      credentials: true,
    },
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmRlZmF1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb25maWcuZGVmYXVsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLGtCQUFlLENBQUMsR0FBZSxFQUE4QixFQUFFO0lBQzNELE9BQU87UUFDSCxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksR0FBRyxPQUFPO1FBRXhCLFFBQVEsRUFBRTtZQUNOLElBQUksRUFBRTtnQkFDRixNQUFNLEVBQUUsS0FBSzthQUNoQjtTQUNKO1FBRUQsSUFBSSxFQUFFO1lBQ0YsTUFBTSxFQUFFLEdBQUc7WUFDWCxZQUFZLEVBQUUscUJBQXFCO1lBQ25DLFdBQVcsRUFBRSxJQUFJO1NBQ3BCO0tBQ0osQ0FBQztBQUNOLENBQUMsQ0FBQyJ9
