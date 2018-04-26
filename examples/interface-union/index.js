const {GraphQLServer} = require("graphql-yoga");

// fake data
const falcon = {
  id: 1,
  name: "Millennium Falcon"
}
const han = {
  id: 2,
  name: "Han Solo",
  starships: [falcon]
}
const r2 = {
  id: 3,
  name: "R2-D2",
  primaryFunction: "Astromech"
}

// schema
const typeDefs = `
  interface Character {
    id: ID!
    name: String!
  }

  union HumanOrDroid = Human | Droid

  type Human implements Character {
    id: ID!
    name: String!
    starships: [Starship]
  }

  type Droid implements Character {
    id: ID!
    name: String!
    primaryFunction: String!
  }

  type Starship {
    id: ID!
    name: String!
  }

  type Query {
    character: Character!,
    humanOrDroid: HumanOrDroid! 
  }
`;

// resolvers
const pickRandomly = () => {
  if (Math.random() < .5) {
    return han
  } else {
    return r2
  }
}
const resolvers = {
  Character: {
    __resolveType(obj) {
      if (obj.primaryFunction) {
        return 'Droid'
      } else {
        return 'Human'
      }
    }
  },
  HumanOrDroid: {
    __resolveType(obj) {
      if (obj.primaryFunction) {
        return 'Droid'
      } else {
        return 'Human'
      }
    }
  },
  Query: {
    character: pickRandomly,
    humanOrDroid: pickRandomly
  }
};

const server = new GraphQLServer({typeDefs, resolvers});

server.start(() => console.log("Server is running on localhost:4000"));
