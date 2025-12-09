const { v4: uuidv4 } = require("uuid");
const notificationCache = require("../../notificationCache");
const { getChannel } = require("../utils/rabbitmq");

/**
 * Process concert recommendations received from events service
 * @param {Object} data - Recommendation data
 */
async function handleConcertRecommendations(data) {
  try {
    const { userId, email, concerts, timestamp } = data;

    console.log(`\nCONCERT RECOMMENDATIONS RECEIVED`);
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log(`Total concerts: ${concerts.length}`);
    console.log(`Timestamp: ${timestamp}`);

    // Display received concerts
    concerts.forEach((concert, index) => {
      console.log(`${index + 1}. ${concert.titulo}`);
      console.log(`   Date: ${concert.data} at ${concert.hora}`);
      console.log(
        `   Location: ${concert.venue} - ${concert.cidade}, ${concert.pais}`
      );
      console.log(`   Genres: ${concert.generos.join(", ")}`);
      console.log(`   URL: ${concert.url_compra}`);
      console.log();
    });

    // Create notification for the user
    const notification = {
      id: uuidv4(),
      user_id: userId,
      type: "concert_recommendations",
      title: "New Concert Recommendations!",
      message: `We found ${concerts.length} concerts that might interest you based on your favorite music genres.`,
      related_id: null,
      related_type: "concerts",
      metadata: {
        concerts: concerts,
        total: concerts.length,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Save notification to cache
    const notificationKey = `notification:${notification.id}`;
    notificationCache.set(notificationKey, notification);

    // Add to user's notification list
    const userKey = `notifications:user:${userId}`;
    const userNotifications = notificationCache.get(userKey) || [];
    userNotifications.unshift(notification.id);
    notificationCache.set(userKey, userNotifications);

    console.log(`Notification created for user ${userId}`);
    console.log(`Notification ID: ${notification.id}\n`);

    return notification;
  } catch (error) {
    console.error("Error processing concert recommendations:", error);
    throw error;
  }
}

/**
 * Start concert recommendations consumer
 */
async function startConcertRecommendationsConsumer() {
  try {
    const channel = getChannel();
    const exchange = "concerts";
    const queue = "notifications.concerts.recommended";
    const routingKey = "concerts.recommended";

    // Create exchange
    await channel.assertExchange(exchange, "topic", { durable: true });

    // Create queue
    await channel.assertQueue(queue, { durable: true });

    // Bind queue to exchange
    await channel.bindQueue(queue, exchange, routingKey);

    console.log(`\nRECOMMENDATIONS CONSUMER STARTED`);
    console.log(`Exchange: ${exchange}`);
    console.log(`Queue: ${queue}`);
    console.log(`Routing Key: ${routingKey}`);
    console.log(`Waiting for concert recommendations...\n`);

    // Consume messages
    channel.consume(
      queue,
      async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Message received from RabbitMQ`);

            await handleConcertRecommendations(content);

            // Acknowledge message processing
            channel.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error.message);
            // Reject message and don't requeue
            channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error starting recommendations consumer:", error.message);
    throw error;
  }
}

module.exports = {
  handleConcertRecommendations,
  startConcertRecommendationsConsumer,
};
