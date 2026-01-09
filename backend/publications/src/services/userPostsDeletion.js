const { getChannel } = require("../utils/rabbitmq");
const concertsModel = require("../model/concertsModel");
const concertsPool = require("../db/concertsDb");

/**
 *Process concert recommendations received from events service
 * @param {Object} data - Recommendation data
 */
async function handleUserDeletion(data) {
  try {
    const { userId, timestamp } = data;

    console.log(`\nUSER DELETION RECEIVED`);
    console.log(`User ID: ${userId}`);
    console.log(`Timestamp: ${timestamp}`);

    try {
      // Delete user's posts
      await concertsModel.deleteConcertsByUserId(userId);
      console.log(`All posts by user ${userId} have been deleted.`);
    } catch (err) {
      console.error(`Error deleting posts for user ${userId}:`, err.message);
    }

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
        const queue = "user.deleted";

        await channel.assertQueue(queue, { durable: true });

        channel.consume(queue, async(msg) => {
            console.log (`Message received from RabbitMQ`);
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    console.log(`Message received from RabbitMQ`);
                    console.log(content);
                } catch (error) {
                    console.error("Error processing message:", error.message);
                }
            }
        })
    }
//   try {
//     const channel = getChannel();
//     const exchange = "concerts";
//     const queue = "notifications.concerts.recommended";
//     const routingKey = "concerts.recommended";

//     //Create exchange
//     await channel.assertExchange(exchange, "topic", { durable: true });

//     //Create queue
//     await channel.assertQueue(queue, { durable: true });

//     //Bind queue to exchange
//     await channel.bindQueue(queue, exchange, routingKey);

//     console.log(`\nRECOMMENDATIONS CONSUMER STARTED`);
//     console.log(`Exchange: ${exchange}`);
//     console.log(`Queue: ${queue}`);
//     console.log(`Routing Key: ${routingKey}`);
//     console.log(`Waiting for concert recommendations...\n`);

//     //Consume messages
//     channel.consume(
//       queue,
//       async (msg) => {
//         if (msg !== null) {
//           try {
//             const content = JSON.parse(msg.content.toString());
//             console.log(`Message received from RabbitMQ`);

//             await handleConcertRecommendations(content);

//             //Acknowledge message processing
//             channel.ack(msg);
//           } catch (error) {
//             console.error("Error processing message:", error.message);
//             //Reject message and don't requeue
//             channel.nack(msg, false, false);
//           }
//         }
//       },
//       { noAck: false }
//     );
//   } catch (error) {
//     console.error("Error starting recommendations consumer:", error.message);
//     throw error;
//   }
}

module.exports = {
  handleConcertRecommendations,
  startConcertRecommendationsConsumer,
};
