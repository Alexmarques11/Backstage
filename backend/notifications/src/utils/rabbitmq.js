const amqp = require("amqplib");

let channel = null;

async function connectRabbitMQ() {
  try {
    // Build RabbitMQ URL from environment variables or use RABBITMQ_URL if provided
    const rabbitmqUrl = process.env.RABBITMQ_URL || 
      `amqp://${process.env.RABBITMQ_USER || 'guest'}:${encodeURIComponent(process.env.RABBITMQ_PASSWORD || 'guest')}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`;
    
    console.log(`Connecting to RabbitMQ at ${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`);
    
    const connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    console.log("Connected to RabbitMQ successfully");
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
