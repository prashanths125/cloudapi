const { connectRabbitMQ } = require("./shared/rabbitmq");
const { provisionEC2 } = require("./awsProvider");

async function start() {
  const channel = await connectRabbitMQ();

  console.log("📦 Orders Service started and listening...");

  channel.consume("events", async (msg) => {
    const event = JSON.parse(msg.content.toString());

    try {
      if (event.type === "ORDER_CREATED") {
        console.log("📩 Event Received:", event);

        if (event.service === "ec2") {
          console.log("🚀 Provisioning EC2 Instance...");
          const instance = await provisionEC2();
          console.log("✅ EC2 Created:", instance.InstanceId);
          console.log("📌 Instance Type:", instance.InstanceType);
        }
      }

      channel.ack(msg);
    } catch (err) {
      console.error("❌ Error Handling Event:", err.message);
      channel.ack(msg);
    }
  });
}

start();
