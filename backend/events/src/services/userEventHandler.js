const { getChannel } = require("../utils/rabbitmq");
const concertsModel = require("../model/concertsModel");

/**
 * Search concerts based on user's music genres
 * @param {Array} genres - List of music genres
 * @returns {Array} - List of up to 5 concerts
 */
async function getConcertsByGenres(genres) {
  try {
    console.log(`Searching concerts for genres: ${genres.join(", ")}`);

    // Search database concerts matching the genres
    const result = await concertsModel.getConcertsByGenresList(genres, 5);

    if (result.length === 0) {
      console.log("No concerts found in database for these genres");
      return [];
    }

    // Get genres for each concert
    const concertIds = result.map((c) => c.id);
    const genresByConcert = await concertsModel.getGenresForConcertIds(
      concertIds
    );

    // Enrich concerts with their genres
    const concerts = result.map((concert) => {
      // Extract date and time from datetime
      const datetime = new Date(concert.datetime);
      const data = datetime.toISOString().split("T")[0];
      const hora = datetime.toTimeString().split(" ")[0];

      return {
        id: concert.id,
        titulo: concert.title,
        data: data,
        hora: hora,
        venue_name: concert.location_name,
        address: concert.address,
        cidade: concert.address ? concert.address.split(",")[0] : "",
        pais: concert.address ? concert.address.split(",").pop().trim() : "",
        bilhetes_disponiveis: concert.tickets_available,
        url_compra: concert.purchase_url,
        imagem: concert.image_url,
        generos: genresByConcert[concert.id]?.map((g) => g.name) || [],
      };
    });

    console.log(`Found ${concerts.length} matching concerts in database`);

    return concerts;
  } catch (error) {
    console.error("Error searching concerts by genres:", error.message);
    console.error("Stack trace:", error.stack);
    return [];
  }
}

/**
 * Send recommended concerts to user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {Array} concerts - List of recommended concerts
 */
async function sendConcertRecommendations(userId, email, concerts) {
  try {
    const channel = getChannel();
    const exchange = "concerts";
    const routingKey = "concerts.recommended";

    await channel.assertExchange(exchange, "topic", { durable: true });

    const message = {
      userId,
      email,
      concerts: concerts.map((c) => ({
        titulo: c.titulo,
        data: c.data,
        hora: c.hora,
        venue: c.venue_name,
        cidade: c.cidade,
        pais: c.pais,
        url_compra: c.url_compra,
        imagem: c.imagem,
        generos: c.generos,
      })),
      timestamp: new Date().toISOString(),
    };

    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    console.log(
      `Sent ${concerts.length} concert recommendations to user ${userId}`
    );

    // DEBUG: Show complete sent message
    console.log(`\nRABBITMQ MESSAGE SENT`);
    console.log(`Exchange: ${exchange}`);
    console.log(`Routing Key: ${routingKey}`);
    console.log(`Message:`);
    console.log(JSON.stringify(message, null, 2));
  } catch (error) {
    console.error("Error sending recommendations:", error.message);
  }
}

/**
 * Process user creation event
 * @param {Object} userData - Created user data
 */
async function handleUserCreated(userData) {
  try {
    // Accept both 'userId' and 'id' for compatibility
    const userId = userData.userId || userData.id;
    const { email, name, genres } = userData;

    console.log(`\nNEW USER CREATED`);
    console.log(`ID: ${userId}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Genres: ${genres.join(", ")}`);

    if (!genres || genres.length === 0) {
      console.log("User has no music genres defined. No recommendations sent.");
      return;
    }

    // Search concerts based on genres
    const recommendedConcerts = await getConcertsByGenres(genres);

    if (recommendedConcerts.length === 0) {
      console.log("No concerts found for user's genres.");
      return;
    }

    // Send recommendations
    await sendConcertRecommendations(userId, email, recommendedConcerts);

    console.log(`Processing completed for user ${userId}\n`);
  } catch (error) {
    console.error("Error processing user created event:", error.message);
  }
}

//Start RabbitMQ consumer for user events

async function startUserEventsConsumer() {
  try {
    const channel = getChannel();
    const exchange = "users";
    const queue = "events.user.created";
    const routingKey = "user.created";

    // Create exchange
    await channel.assertExchange(exchange, "topic", { durable: true });

    // Create queue
    await channel.assertQueue(queue, { durable: true });

    // Bind queue to exchange
    await channel.bindQueue(queue, exchange, routingKey);

    console.log(`\nRABBITMQ CONSUMER STARTED`);
    console.log(`Exchange: ${exchange}`);
    console.log(`Queue: ${queue}`);
    console.log(`Routing Key: ${routingKey}`);
    console.log(`Waiting for messages...\n`);

    // Consume messages
    channel.consume(
      queue,
      async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Message received:`, content);

            await handleUserCreated(content);

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
    console.error("Error starting consumer:", error.message);
  }
}

module.exports = {
  startUserEventsConsumer,
  handleUserCreated,
};
