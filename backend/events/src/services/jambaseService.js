const axios = require("axios");

// === CONFIG ===
const API_KEY = process.env.JAMBASE_API_KEY;
const BASE_URL = "https://www.jambase.com/jb-api/v1";

/**
 * Buscar eventos de música
 */
async function fetchEvents(params = {}) {
  try {
    const defaultParams = {
      apikey: API_KEY,
      page: 0,
      perPage: 10,
    };

    const response = await axios.get(`${BASE_URL}/events`, {
      params: { ...defaultParams, ...params },
    });

    const events = response.data.events || [];
    const pagination = response.data.pagination || {};

    if (events.length === 0) {
      console.log("❌ Nenhum evento encontrado.\n");
      return [];
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`🎸 EVENTOS MUSICAIS - JAMBASE`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Página: ${pagination.page + 1} | Total: ${pagination.total}`);
    console.log(`${"=".repeat(80)}\n`);

    const mapped = events.map((event, index) => {
      const venue = event.location || {};
      const performers = event.performers || [];

      console.log(`\n${"-".repeat(80)}`);
      console.log(`EVENTO ${index + 1}: ${event.name}`);
      console.log(`${"-".repeat(80)}`);
      console.log(
        `📅 Data: ${new Date(event.startDate).toLocaleString("pt-PT")}`
      );

      if (performers.length > 0) {
        console.log(`🎤 Artistas: ${performers.map((p) => p.name).join(", ")}`);
      }

      console.log(`📍 Local: ${venue.name || "N/A"}`);
      console.log(
        `🏙️  Cidade: ${venue.address?.cityName || "N/A"}, ${
          venue.address?.stateName || ""
        } ${venue.address?.countryCode || ""}`
      );

      if (event.description) {
        console.log(
          `\n📝 Descrição: ${event.description.substring(0, 200)}...`
        );
      }

      console.log(`\n🎫 BILHETES:`);
      if (event.offers && event.offers.length > 0) {
        event.offers.forEach((offer, idx) => {
          const tipo = offer.type || offer.category || "Bilhete";
          console.log(`   ${idx + 1}. ${tipo}: ${offer.url}`);
          if (offer.availability) {
            console.log(`      Disponibilidade: ${offer.availability}`);
          }
          if (offer.price) {
            console.log(
              `      Preço: ${offer.price} ${offer.priceCurrency || ""}`
            );
          }
        });
      } else {
        console.log(`   Sem informação de bilhetes`);
      }

      console.log(`\n🖼️  IMAGENS DOS ARTISTAS:`);
      performers.forEach((performer, idx) => {
        if (performer.image) {
          console.log(`\n   ${performer.name}:`);
          console.log(`      URL: ${performer.image}`);
        }
        if (performer.genres && performer.genres.length > 0) {
          console.log(`      Géneros: ${performer.genres.join(", ")}`);
        }
      });

      if (event.image) {
        console.log(`\n   📸 Imagem do Evento:`);
        console.log(`      ${event.image}`);
      }

      console.log(`\n🔗 URLs:`);
      console.log(`   Evento: ${event.url || "N/A"}`);
      console.log(`   Venue: ${venue.url || "N/A"}`);

      console.log(`${"-".repeat(80)}\n`);

      return {
        id: event.identifier,
        nome: event.name,
        data_inicio: event.startDate,
        data_fim: event.endDate,
        descricao: event.description,
        url: event.url,
        imagem: event.image,

        artistas: performers.map((p) => ({
          id: p.identifier,
          nome: p.name,
          imagem: p.image,
          generos: p.genres || [],
          url: p.url,
        })),

        local: {
          id: venue.identifier,
          nome: venue.name,
          url: venue.url,
          endereco: {
            rua: venue.address?.streetAddress,
            cidade: venue.address?.cityName,
            estado: venue.address?.stateName,
            codigo_postal: venue.address?.postalCode,
            pais: venue.address?.countryCode,
          },
          coordenadas: {
            latitude: venue.geoCodes?.latitude,
            longitude: venue.geoCodes?.longitude,
          },
        },

        ofertas:
          event.offers?.map((offer) => ({
            tipo: offer.type,
            url: offer.url,
            disponibilidade: offer.availability,
          })) || [],
      };
    });

    console.log(`\n✅ Total de eventos nesta página: ${mapped.length}`);
    console.log(`\n📋 Exemplo de dados JSON completos:`);
    console.log(JSON.stringify(mapped[0], null, 2));
    console.log(`\n${"=".repeat(80)}\n`);

    return {
      eventos: mapped,
      paginacao: pagination,
    };
  } catch (err) {
    console.error("❌ Erro ao chamar Jambase API:", err.message);
    if (err.response) {
      console.error(`   Status: ${err.response.status}`);
      console.error(`   Dados:`, err.response.data);
    }
    return { eventos: [], paginacao: {} };
  }
}

/**
 * Buscar eventos por artista
 */
async function fetchEventsByArtist(artistName, limit = 10) {
  return fetchEvents({
    artistName: artistName,
    perPage: limit,
  });
}

/**
 * Buscar eventos por localização
 */
async function fetchEventsByLocation(geoCity, limit = 10) {
  return fetchEvents({
    geoCity: geoCity,
    perPage: limit,
  });
}

/**
 * Buscar eventos por país
 */
async function fetchEventsByCountry(geoCountryCode, limit = 10) {
  return fetchEvents({
    geoCountryCode: geoCountryCode,
    perPage: limit,
  });
}

/**
 * Buscar eventos por intervalo de datas
 */
async function fetchEventsByDateRange(startDate, endDate, limit = 10) {
  return fetchEvents({
    startDate: startDate, // formato: YYYY-MM-DD
    endDate: endDate,
    perPage: limit,
  });
}

module.exports = {
  fetchEvents,
  fetchEventsByArtist,
  fetchEventsByLocation,
  fetchEventsByCountry,
  fetchEventsByDateRange,
};
