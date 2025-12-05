const axios = require("axios");

// === CONFIG ===
const API_KEY = process.env.TICKETMASTER_API_KEY;
const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

//Extract the best image from the array based on predefined criteria
function extractBestImage(images) {
  if (!images || images.length === 0) return null;

  const primary = images.find(
    (img) => img.role === "primary" && img.ratio === "16_9"
  );
  if (primary) return primary.url;

  const retina169 = images.find((img) =>
    img.url?.includes("RETINA_LANDSCAPE_16_9")
  );
  if (retina169) return retina169.url;

  const ratio169 = images.find((img) => img.ratio === "16_9");
  if (ratio169) return ratio169.url;

  const biggest = images.sort(
    (a, b) => b.width * b.height - a.width * a.height
  )[0];
  return biggest?.url ?? null;
}

//Fetch concerts from Ticketmaster API
async function fetchConcerts(country = null, date = null, size = 20) {
  try {
    const params = {
      apikey: API_KEY,
      classificationName: "music",
      size: size,
      sort: "date,asc",
    };

    if (country) {
      params.countryCode = country;
    } else {
      params.countryCode = "US";
    }

    if (date) {
      params.startDateTime = `${date}T00:00:00Z`;
      params.endDateTime = `${date}T23:59:59Z`;
    } else {
      const today = new Date().toISOString().split("T")[0];
      params.startDateTime = `${today}T00:00:00Z`;
    }

    const response = await axios.get(BASE_URL, { params });

    const events = response.data?._embedded?.events ?? [];

    if (events.length === 0) {
      console.log("No events found on Ticketmaster.\n");
      return [];
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(` MUSIC EVENTS - TICKETMASTER`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Total events: ${events.length}`);
    console.log(`${"=".repeat(80)}\n`);

    const mapped = events
      .filter((ev) => {
        // Filter only music events
        const hasMusic =
          ev.classifications?.some(
            (c) => c.segment?.name?.toLowerCase() === "music"
          ) || ev.classifications?.[0]?.genre?.name;

        return hasMusic;
      })
      .map((ev, index) => {
        const venue = ev._embedded?.venues?.[0] ?? {};
        const images = ev.images ?? [];

        console.log(`\n${"-".repeat(80)}`);
        console.log(`EVENT ${index + 1}: ${ev.name}`);
        console.log(`${"-".repeat(80)}`);
        console.log(
          `Date: ${ev.dates?.start?.localDate ?? "N/A"} at ${
            ev.dates?.start?.localTime ?? "N/A"
          }`
        );

        // Extract ALL available genres
        const genres = ev.classifications
          ?.map((c) => c.genre?.name)
          .filter(Boolean);

        const genresList =
          genres?.length > 0 ? genres.join(", ") : "Not specified";
        console.log(`Genres: ${genresList}`);
        console.log(`Location: ${venue.name || "N/A"}`);

        const location = [
          venue.city?.name,
          venue.state?.name,
          venue.country?.name,
        ]
          .filter(Boolean)
          .join(", ");
        if (location) {
          console.log(`City: ${location}`);
        }

        if (ev.priceRanges && ev.priceRanges.length > 0) {
          console.log(`\nPRICES:`);
          console.log(
            `   Minimum: ${ev.priceRanges[0].min} ${ev.priceRanges[0].currency}`
          );
          console.log(
            `   Maximum: ${ev.priceRanges[0].max} ${ev.priceRanges[0].currency}`
          );
        }

        console.log(
          `\nTickets: ${
            ev.dates?.status?.code === "onsale" ? "Available" : "Unavailable"
          }`
        );
        console.log(`URL: ${ev.url}`);

        const mainImage = extractBestImage(images);
        if (mainImage) {
          console.log(`\nMain Image:`);
          console.log(`   ${mainImage}`);
        }

        if (ev.promoters && ev.promoters.length > 0) {
          console.log(`\nOrganizer: ${ev.promoters[0].name}`);
        }

        console.log(`${"-".repeat(80)}\n`);

        //Build structured address
        const address =
          [venue.address?.address, venue.postalCode]
            .filter(Boolean)
            .join(", ") || null;

        const cidade = venue.city?.name || null;
        const estado = venue.state?.name || null;
        const pais = venue.country?.name || null;

        return {
          titulo: ev.name,
          generos: genres && genres.length > 0 ? genres : ["NNot specified"],

          data: ev.dates?.start?.localDate ?? null,
          hora: ev.dates?.start?.localTime ?? null,

          bilhetes_disponiveis: ev.dates?.status?.code === "onsale",
          url_compra: ev.url,

          preco_minimo: ev.priceRanges?.[0]?.min ?? null,
          moeda: ev.priceRanges?.[0]?.currency ?? null,

          imagem: extractBestImage(images),

          //Structured location data
          venue_name: venue.name || "Location not available",
          address: address,
          cidade: cidade,
          estado: estado,
          pais: pais,
          geo_location: venue.location
            ? `${venue.location.latitude},${venue.location.longitude}`
            : null,

          organizador: ev.promoters?.[0]?.name ?? ev.promoter?.name ?? null,
        };
      });

    console.log(`\nTotal Ticketmaster events: ${mapped.length}\n`);
    console.log(`\nSample JSON data:`);
    console.log(JSON.stringify(mapped[0], null, 2));
    console.log(`\n${"=".repeat(80)}\n`);

    return mapped;
  } catch (err) {
    console.error("Error calling Ticketmaster:", err.message);
    return [];
  }
}

module.exports = { fetchConcerts };
