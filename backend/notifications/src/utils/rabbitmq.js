const amqp = require("amqplib");

let channel = null;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost"
    );
    channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
  }
}

function getChannel() {
  if (!channel) {
    throw new Error(
      "RabbitMQ channel is not initialized. Call connectRabbitMQ first."
    );
  }
  return channel;
}

module.exports = {
  connectRabbitMQ,
  getChannel,
};
