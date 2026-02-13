const { ApolloServer, gql } = require("apollo-server");
const amqp = require("amqplib");

const typeDefs = gql`
  type Mutation {
    createOrder(service: String!): String
  }

  type Query {
    health: String
  }
`;

async function publishEvent(event) {
  const connection = await amqp.connect("amqp://rabbitmq");
  const channel = await connection.createChannel();
  await channel.assertQueue("events");

  channel.sendToQueue("events", Buffer.from(JSON.stringify(event)));

  await channel.close();
  await connection.close();
}

const resolvers = {
  Query: {
    health: () => "Gateway is running"
  },
  Mutation: {
    createOrder: async (_, { service }) => {
      const event = {
        type: "ORDER_CREATED",
        service,
        timestamp: new Date().toISOString()
      };

      await publishEvent(event);

      return `Order created for service: ${service}`;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 GraphQL Gateway running at ${url}`);
});
