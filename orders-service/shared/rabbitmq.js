const amqp = require("amqplib");

async function connectRabbitMQ(retries = 10, delay = 5000) {
  while (retries > 0) {
    try {
      console.log(`🔄 Connecting to RabbitMQ... retries left: ${retries}`);
      const connection = await amqp.connect("amqp://rabbitmq");
      const channel = await connection.createChannel();
      await channel.assertQueue("events");
      console.log("✅ Connected to RabbitMQ");
      return channel;
    } catch (err) {
      console.log("❌ RabbitMQ not ready yet. Waiting...");
      retries--;

      if (retries === 0) {
        throw err;
      }

      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

module.exports = { connectRabbitMQ };
