const amqp = require("amqplib");

class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 
      `amqp://${process.env.RABBITMQ_USER || 'backstage'}:${process.env.RABBITMQ_PASSWORD || 'rabbitmq123'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}`;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      console.log("✅ Connected to RabbitMQ");

      // Handle connection errors
      this.connection.on("error", (err) => {
        console.error("❌ RabbitMQ connection error:", err);
      });

      this.connection.on("close", () => {
        console.warn("⚠️  RabbitMQ connection closed. Reconnecting...");
        setTimeout(() => this.connect(), 5000);
      });

      return this.channel;
    } catch (err) {
      console.error("❌ Failed to connect to RabbitMQ:", err.message);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async assertQueue(queueName, options = { durable: true }) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    await this.channel.assertQueue(queueName, options);
  }

  async assertExchange(exchangeName, type = "topic", options = { durable: true }) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    await this.channel.assertExchange(exchangeName, type, options);
  }

  async publish(exchange, routingKey, message, options = {}) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    const content = Buffer.from(JSON.stringify(message));
    return this.channel.publish(exchange, routingKey, content, {
      persistent: true,
      ...options,
    });
  }

  async sendToQueue(queueName, message, options = {}) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    const content = Buffer.from(JSON.stringify(message));
    return this.channel.sendToQueue(queueName, content, {
      persistent: true,
      ...options,
    });
  }

  async consume(queueName, callback, options = {}) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    return this.channel.consume(
      queueName,
      async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content, msg);
            this.channel.ack(msg);
          } catch (err) {
            console.error("Error processing message:", err);
            this.channel.nack(msg, false, false); // Don't requeue failed messages
          }
        }
      },
      { noAck: false, ...options }
    );
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    console.log("🔌 Closed RabbitMQ connection");
  }
}

// Singleton instance
const rabbitmqClient = new RabbitMQClient();

module.exports = rabbitmqClient;
