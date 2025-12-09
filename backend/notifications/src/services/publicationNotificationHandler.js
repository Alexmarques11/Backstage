const { v4: uuidv4 } = require("uuid");
const notificationCache = require("../../notificationCache");
const { getChannel } = require("../utils/rabbitmq");

/**
 *Process publication notification requests
 * @param {Object} data - Notification data
 */
async function handlePublicationNotification(data) {
  try {
    const {
      userId,
      type,
      title,
      message,
      data: publicationData,
      createdAt,
    } = data;

    console.log(`\nPUBLICATION NOTIFICATION RECEIVED`);
    console.log(`User ID: ${userId}`);
    console.log(`Type: ${type}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);

    //Create notification for the user
    const notification = {
      id: uuidv4(),
      user_id: userId,
      type: type || "new_publication",
      title: title,
      message: message,
      related_id: publicationData?.concertId || null,
      related_type: "concert",
      metadata: {
        concertTitle: publicationData?.concertTitle,
        genres: publicationData?.genres,
        location: publicationData?.location,
        date: publicationData?.date,
        image_url: publicationData?.image_url,
      },
      is_read: false,
      created_at: createdAt || new Date().toISOString(),
    };

    //Save notification to cache
    const notificationKey = `notification:${notification.id}`;
    notificationCache.set(notificationKey, notification);

    //Add to user's notification list
    const userKey = `notifications:user:${userId}`;
    const userNotifications = notificationCache.get(userKey) || [];
    userNotifications.unshift(notification.id);
    notificationCache.set(userKey, userNotifications);

    console.log(`Notification created for user ${userId}`);
    console.log(`   Notification ID: ${notification.id}`);
    console.log(`   Concert: ${publicationData?.concertTitle}\n`);

    return notification;
  } catch (error) {
    console.error("Error processing publication notification:", error);
    throw error;
  }
}

/**
 *Start publication notification consumer
 */
async function startPublicationNotificationConsumer() {
  try {
    const channel = getChannel();
    const queue = "notification_request";

    //Create queue
    await channel.assertQueue(queue, { durable: true });

    //Prefetch only 1 message at a time
    channel.prefetch(1);

    console.log(`\nPUBLICATION NOTIFICATION CONSUMER STARTED`);
    console.log(`Queue: ${queue}`);
    console.log(`Waiting for publication notifications...\n`);

    //Consume messages
    channel.consume(
      queue,
      async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Message received from RabbitMQ`);

            await handlePublicationNotification(content);

            // Acknowledge message processing
            channel.ack(msg);
          } catch (error) {
            console.error(
              "Error processing notification message:",
              error.message
            );
            // Reject message and requeue for retry
            channel.nack(msg, false, true);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error(
      "Error starting publication notification consumer:",
      error.message
    );
    throw error;
  }
}

module.exports = {
  handlePublicationNotification,
  startPublicationNotificationConsumer,
};
