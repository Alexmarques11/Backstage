const authPool = require("../db/authDb");
const { getChannel } = require("../utils/rabbitmq");

//Handler for publication created events
//Fetches users with matching music genres and sends notifications
async function handlePublicationCreated(message) {
  try {
    const publication = JSON.parse(message.content.toString());
    console.log("Processing publication created event:", publication);

    const { concertId, title, description, genres, location, date, image_url } =
      publication;

    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      console.log("No genres provided for publication, skipping notification");
      return;
    }

    //Find all users who have preferences matching the publication genres
    const usersResult = await authPool.query(
      `SELECT DISTINCT u.id, u.name, u.email
       FROM users u
       JOIN users_genres ug ON u.id = ug.user_id
       JOIN music_genres mg ON ug.genre_id = mg.id
       WHERE mg.name = ANY($1)`,
      [genres]
    );

    const users = usersResult.rows;

    if (users.length === 0) {
      console.log("No users found with matching genre preferences");
      return;
    }

    console.log(`Found ${users.length} users with matching genres`);

    //Send notification for each user
    const channel = getChannel();
    const notificationQueue = "notification_request";

    await channel.assertQueue(notificationQueue, { durable: true });

    for (const user of users) {
      const notificationMessage = {
        userId: user.id,
        type: "new_publication",
        title: "New Publication",
        message: `A new publication "${title}" has been created with genres you like!`,
        data: {
          concertId,
          concertTitle: title,
          concertDescription: description,
          genres,
          location,
          date,
          image_url,
        },
        createdAt: new Date().toISOString(),
      };

      channel.sendToQueue(
        notificationQueue,
        Buffer.from(JSON.stringify(notificationMessage)),
        { persistent: true }
      );

      console.log(`Notification sent for user ${user.id} (${user.email})`);
    }

    console.log(
      `Successfully processed publication ${concertId} and sent ${users.length} notifications`
    );
  } catch (error) {
    console.error("Error handling publication created event:", error);
    throw error;
  }
}

//Start listening for publication created events
async function startPublicationEventListener() {
  try {
    const channel = getChannel();
    const queue = "publication_created";

    await channel.assertQueue(queue, { durable: true });

    //Prefetch only 1 message at a time
    channel.prefetch(1);

    console.log(`Waiting for publication events in queue: ${queue}`);

    channel.consume(
      queue,
      async (message) => {
        if (message !== null) {
          try {
            await handlePublicationCreated(message);
            channel.ack(message);
          } catch (error) {
            console.error("Error processing message:", error);
            //Reject and requeue the message for retry
            channel.nack(message, false, true);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error starting publication event listener:", error);
    throw error;
  }
}

module.exports = {
  startPublicationEventListener,
  handlePublicationCreated,
};
