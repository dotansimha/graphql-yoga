import { createPubSub, createSchema, createYoga } from 'graphql-yoga';
import { useSofa } from '@graphql-yoga/plugin-sofa';

const pizzas = [
  { id: 1, dough: 'pan', toppings: ['cheese'] },
  { id: 2, dough: 'classic', toppings: ['ham'] },
];
const books = [
  { id: 1, title: 'Book A', type: 'AUDIO' },
  { id: 2, title: 'Book B', type: 'LEGACY' },
];
const users = [
  {
    id: 1,
    name: 'User A',
    favoritePizza: pizzas[0],
    favoriteBook: books[0],
    favoriteFood: pizzas[1],
    shelf: books,
  },
  {
    id: 2,
    name: 'User B',
    favoritePizza: pizzas[1],
    favoriteBook: books[1],
    favoriteFood: {
      ingredients: ['green shit', 'chicken', 'green shit', 'yellow shit', 'red shit'],
    },
    shelf: books,
  },
];

const posts = [
  {
    comments: ['Foo', 'Bar', 'Baz', 'Foo Bar', 'Foo Baz', 'Bar Baz'],
  },
];

const UsersCollection = {
  get(id: string | number) {
    const uid = typeof id === 'string' ? parseInt(id, 10) : id;

    return users.find(u => u.id === uid);
  },
  all() {
    return users;
  },
};

const BooksCollection = {
  get(id: string | number) {
    const bid = typeof id === 'string' ? parseInt(id, 10) : id;

    return books.find(u => u.id === bid);
  },
  all() {
    return books;
  },
  add(title: string) {
    const book = {
      id: parseInt(Math.random().toString(10).substr(2), 10),
      title,
      type: 'LEGACY',
    };

    books.push(book);

    return book;
  },
};

const PostsCollection = {
  all() {
    return posts;
  },
};

const pubsub = createPubSub();
const BOOK_ADDED = 'BOOK_ADDED';
const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Pizza {
      dough: String!
      toppings: [String!]
    }

    type Salad {
      ingredients: [String!]!
    }

    union Food = Pizza | Salad

    type Book {
      id: ID!
      title: String!
      type: BookType!
    }

    enum BookType {
      AUDIO
      LEGACY
    }

    type User {
      id: ID!
      name: String!
      favoritePizza: Pizza!
      favoriteBook: Book!
      favoriteFood: Food!
      shelf: [Book!]!
    }

    type Post {
      comments(filter: String!): [String!]
    }

    type Query {
      """
      Resolves current user
      """
      me: User
      user(id: ID!): User
      users: [User!]
      usersLimit(limit: Int!): [User!]
      usersSort(sort: Boolean!): [User!]
      book(id: ID!): Book
      books: [Book!]
      never: String
      feed: [Post]
    }

    type Mutation {
      addBook(title: String!): Book
    }

    type Subscription {
      onBook: Book
    }

    schema {
      query: Query
      mutation: Mutation
      subscription: Subscription
    }
  `,
  resolvers: {
    Query: {
      me() {
        return UsersCollection.get(1);
      },
      user(_: unknown, { id }: { id: string }) {
        return UsersCollection.get(id);
      },
      users() {
        return UsersCollection.all();
      },
      usersLimit(_: unknown, { limit }: { limit: number }) {
        return UsersCollection.all().slice(0, limit);
      },
      usersSort(_: unknown, { sort }: { sort: number }) {
        const users = UsersCollection.all();
        return sort ? users.sort((a, b) => b.id - a.id) : users;
      },
      book(_: unknown, { id }: { id: string }) {
        return BooksCollection.get(id);
      },
      books() {
        return BooksCollection.all();
      },
      feed() {
        return PostsCollection.all();
      },
      never() {
        throw new Error('Some Message');
      },
    },
    Mutation: {
      addBook(_: unknown, { title }: { title: string }) {
        const book = BooksCollection.add(title);

        pubsub.publish(BOOK_ADDED, { onBook: book });

        return book;
      },
    },
    Subscription: {
      onBook: {
        subscribe: () => pubsub.subscribe(BOOK_ADDED),
      },
    },
    Food: {
      __resolveType(obj: { ingredients?: string[]; toppings?: string[] }) {
        if (obj.ingredients) {
          return 'Salad';
        }

        if (obj.toppings) {
          return 'Pizza';
        }

        return null;
      },
    },
    Post: {
      comments(post: { comments: string[] }, { filter }: { filter: string }) {
        return post.comments.filter(
          comment => !filter || comment.toLowerCase().includes(filter.toLowerCase()),
        );
      },
    },
  },
});

export const restEndpoint = '/rest';

export const yoga = createYoga({
  schema,
  plugins: [
    useSofa({
      basePath: restEndpoint,
    }),
  ],
});
