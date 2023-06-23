import { yoga } from '../src/yoga.js'

describe('SOFA', () => {
  it('serve Swagger UI correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/rest/docs')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    const html = await response.text()
    expect(html).toContain('<title>SwaggerUI</title>')
  })
  it('serve Swagger JSON correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/rest/openapi.json')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    const json = await response.json()
    expect(json).toMatchInlineSnapshot(`
      {
        "components": {
          "schemas": {
            "Book": {
              "properties": {
                "id": {
                  "type": "string",
                },
                "title": {
                  "type": "string",
                },
                "type": {
                  "enum": [
                    "AUDIO",
                    "LEGACY",
                  ],
                  "type": "string",
                },
              },
              "required": [
                "id",
                "title",
                "type",
              ],
              "type": "object",
            },
            "Mutation": {
              "properties": {
                "addBook": {
                  "$ref": "#/components/schemas/Book",
                },
              },
              "type": "object",
            },
            "Pizza": {
              "properties": {
                "dough": {
                  "type": "string",
                },
                "toppings": {
                  "items": {
                    "type": "string",
                  },
                  "type": "array",
                },
              },
              "required": [
                "dough",
              ],
              "type": "object",
            },
            "Post": {
              "properties": {
                "comments": {
                  "items": {
                    "type": "string",
                  },
                  "type": "array",
                },
              },
              "type": "object",
            },
            "Query": {
              "properties": {
                "book": {
                  "$ref": "#/components/schemas/Book",
                },
                "books": {
                  "items": {
                    "$ref": "#/components/schemas/Book",
                  },
                  "type": "array",
                },
                "feed": {
                  "items": {
                    "$ref": "#/components/schemas/Post",
                  },
                  "type": "array",
                },
                "me": {
                  "$ref": "#/components/schemas/User",
                  "description": "Resolves current user",
                },
                "never": {
                  "type": "string",
                },
                "user": {
                  "$ref": "#/components/schemas/User",
                },
                "users": {
                  "items": {
                    "$ref": "#/components/schemas/User",
                  },
                  "type": "array",
                },
                "usersLimit": {
                  "items": {
                    "$ref": "#/components/schemas/User",
                  },
                  "type": "array",
                },
                "usersSort": {
                  "items": {
                    "$ref": "#/components/schemas/User",
                  },
                  "type": "array",
                },
              },
              "type": "object",
            },
            "Salad": {
              "properties": {
                "ingredients": {
                  "items": {
                    "type": "string",
                  },
                  "type": "array",
                },
              },
              "required": [
                "ingredients",
              ],
              "type": "object",
            },
            "Subscription": {
              "properties": {
                "onBook": {
                  "$ref": "#/components/schemas/Book",
                },
              },
              "type": "object",
            },
            "User": {
              "properties": {
                "favoriteBook": {
                  "$ref": "#/components/schemas/Book",
                },
                "favoriteFood": {
                  "type": "object",
                },
                "favoritePizza": {
                  "$ref": "#/components/schemas/Pizza",
                },
                "id": {
                  "type": "string",
                },
                "name": {
                  "type": "string",
                },
                "shelf": {
                  "items": {
                    "$ref": "#/components/schemas/Book",
                  },
                  "type": "array",
                },
              },
              "required": [
                "id",
                "name",
                "favoritePizza",
                "favoriteBook",
                "favoriteFood",
                "shelf",
              ],
              "type": "object",
            },
          },
        },
        "info": {
          "description": "Generated by SOFA",
          "title": "SOFA API",
          "version": "0.0.0",
        },
        "openapi": "3.0.1",
        "paths": {
          "/add-book": {
            "post": {
              "parameters": [
                {
                  "in": "query",
                  "name": "title",
                  "required": true,
                  "schema": {
                    "type": "string",
                  },
                },
              ],
              "requestBody": {
                "content": {
                  "application/json": {
                    "schema": {
                      "properties": {
                        "title": {
                          "type": "string",
                        },
                      },
                      "required": [
                        "title",
                      ],
                      "type": "object",
                    },
                  },
                },
              },
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/Book",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/book/{id}": {
            "get": {
              "parameters": [
                {
                  "in": "path",
                  "name": "id",
                  "required": true,
                  "schema": {
                    "type": "string",
                  },
                },
              ],
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/Book",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/books": {
            "get": {
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "items": {
                          "$ref": "#/components/schemas/Book",
                        },
                        "type": "array",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/feed": {
            "get": {
              "parameters": [
                {
                  "in": "query",
                  "name": "feed_comments_filter",
                  "required": true,
                  "schema": {
                    "type": "string",
                  },
                },
              ],
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "items": {
                          "$ref": "#/components/schemas/Post",
                        },
                        "type": "array",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/me": {
            "get": {
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/User",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/never": {
            "get": {
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "type": "string",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/user/{id}": {
            "get": {
              "parameters": [
                {
                  "in": "path",
                  "name": "id",
                  "required": true,
                  "schema": {
                    "type": "string",
                  },
                },
              ],
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/User",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/users": {
            "get": {
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "items": {
                          "$ref": "#/components/schemas/User",
                        },
                        "type": "array",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/users-limit": {
            "get": {
              "parameters": [
                {
                  "in": "query",
                  "name": "limit",
                  "required": true,
                  "schema": {
                    "format": "int32",
                    "type": "integer",
                  },
                },
              ],
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "items": {
                          "$ref": "#/components/schemas/User",
                        },
                        "type": "array",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
          "/users-sort": {
            "get": {
              "parameters": [
                {
                  "in": "query",
                  "name": "sort",
                  "required": true,
                  "schema": {
                    "type": "boolean",
                  },
                },
              ],
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "items": {
                          "$ref": "#/components/schemas/User",
                        },
                        "type": "array",
                      },
                    },
                  },
                  "description": "",
                },
              },
            },
          },
        },
        "servers": [
          {
            "url": "/rest",
          },
        ],
      }
    `)
  })
  it('serve GraphiQL correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/graphql', {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    const html = await response.text()
    expect(html).toContain('<title>Yoga GraphiQL</title>')
  })
  it('serve GraphQL API correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            users {
              id
              name
            }
          }
        `,
      }),
    })
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toMatchInlineSnapshot(`
      {
        "data": {
          "users": [
            {
              "id": "1",
              "name": "User A",
            },
            {
              "id": "2",
              "name": "User B",
            },
          ],
        },
      }
    `)
  })
  it('serve REST API correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/rest/me')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    const json = await response.json()
    expect(json).toMatchInlineSnapshot(`
      {
        "favoriteBook": {
          "id": "1",
        },
        "favoriteFood": {
          "dough": "classic",
          "toppings": [
            "ham",
          ],
        },
        "favoritePizza": {
          "dough": "pan",
          "toppings": [
            "cheese",
          ],
        },
        "id": "1",
        "name": "User A",
        "shelf": [
          {
            "id": "1",
          },
          {
            "id": "2",
          },
        ],
      }
    `)
  })
})
