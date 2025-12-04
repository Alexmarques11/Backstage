const axios = require("axios");

// === CONFIG ===
const API_KEY = process.env.TICKETMASTER_API_KEY;
const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5000";

function extractBestImage(images) {
  if (!images || images.length === 0) return null;

  // 1 — Imagem principal do evento (role=primary)
  const primary = images.find(
    (img) => img.role === "primary" && img.ratio === "16_9"
  );
  if (primary) return primary.url;

  // 2 — LANDSCAPE 16:9
  const retina169 = images.find((img) =>
    img.url?.includes("RETINA_LANDSCAPE_16_9")
  );
  if (retina169) return retina169.url;

  // 3 — Qualquer 16:9
  const ratio169 = images.find((img) => img.ratio === "16_9");
  if (ratio169) return ratio169.url;

  // 4 — Maior resolução
  const biggest = images.sort(
    (a, b) => b.width * b.height - a.width * a.height
  )[0];
  return biggest?.url ?? null;
}

async function fetchConcerts(country = null, date = null, size = 20) {
  try {
    const params = {
      apikey: API_KEY,
      classificationName: "music",
      size: size,
      sort: "date,asc",
    };

    // País é obrigatório na Ticketmaster, usa padrão se não fornecido
    if (country) {
      params.countryCode = country;
    } else {
      params.countryCode = "US"; // Padrão: Estados Unidos
    }

    // Se pedirem uma data específica
    if (date) {
      params.startDateTime = `${date}T00:00:00Z`;
      params.endDateTime = `${date}T23:59:59Z`;
    } else {
      // Se não pedir data, busca a partir de hoje
      const today = new Date().toISOString().split("T")[0];
      params.startDateTime = `${today}T00:00:00Z`;
    }

    const response = await axios.get(BASE_URL, { params });

    const events = response.data?._embedded?.events ?? [];

    if (events.length === 0) {
      console.log("❌ Nenhum evento encontrado na Ticketmaster.\n");
      return [];
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`🎫 EVENTOS MUSICAIS - TICKETMASTER`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Total de eventos: ${events.length}`);
    console.log(`${"=".repeat(80)}\n`);

    const mapped = events.map((ev, index) => {
      const venue = ev._embedded?.venues?.[0] ?? {};
      const images = ev.images ?? [];

      console.log(`\n${"-".repeat(80)}`);
      console.log(`EVENTO ${index + 1}: ${ev.name}`);
      console.log(`${"-".repeat(80)}`);
      console.log(
        `📅 Data: ${ev.dates?.start?.localDate ?? "N/A"} às ${
          ev.dates?.start?.localTime ?? "N/A"
        }`
      );
      console.log(
        `🎵 Género: ${ev.classifications?.[0]?.genre?.name ?? "N/A"}`
      );
      console.log(`📍 Local: ${venue.name || "N/A"}`);

      const localizacao = [
        venue.city?.name,
        venue.state?.name,
        venue.country?.name,
      ]
        .filter(Boolean)
        .join(", ");
      if (localizacao) {
        console.log(`🏙️  Cidade: ${localizacao}`);
      }

      if (ev.priceRanges && ev.priceRanges.length > 0) {
        console.log(`\n💰 PREÇOS:`);
        console.log(
          `   Mínimo: ${ev.priceRanges[0].min} ${ev.priceRanges[0].currency}`
        );
        console.log(
          `   Máximo: ${ev.priceRanges[0].max} ${ev.priceRanges[0].currency}`
        );
      }

      console.log(
        `\n🎫 Bilhetes: ${
          ev.dates?.status?.code === "onsale"
            ? "✅ Disponíveis"
            : "❌ Indisponíveis"
        }`
      );
      console.log(`🔗 URL: ${ev.url}`);

      const mainImage = extractBestImage(images);
      if (mainImage) {
        console.log(`\n🖼️  Imagem Principal:`);
        console.log(`   ${mainImage}`);
      }

      if (ev.promoters && ev.promoters.length > 0) {
        console.log(`\n🏢 Organizador: ${ev.promoters[0].name}`);
      }

      console.log(`${"-".repeat(80)}\n`);

      // Construir endereço de forma estruturada
      const address =
        [venue.address?.address, venue.postalCode].filter(Boolean).join(", ") ||
        null;

      const cidade = venue.city?.name || null;
      const estado = venue.state?.name || null;
      const pais = venue.country?.name || null;

      return {
        titulo: ev.name,
        genero_musical:
          ev.classifications?.[0]?.genre?.name ?? "Não especificado",

        data: ev.dates?.start?.localDate ?? null,
        hora: ev.dates?.start?.localTime ?? null,

        bilhetes_disponiveis: ev.dates?.status?.code === "onsale",
        url_compra: ev.url,

        preco_minimo: ev.priceRanges?.[0]?.min ?? null,
        moeda: ev.priceRanges?.[0]?.currency ?? null,

        imagem: extractBestImage(images),

        // Dados estruturados da localização
        venue_name: venue.name || "Localização não disponível",
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

    console.log(`\n✅ Total de eventos Ticketmaster: ${mapped.length}\n`);
    console.log(`\n📋 Exemplo de dados JSON:`);
    console.log(JSON.stringify(mapped[0], null, 2));
    console.log(`\n${"=".repeat(80)}\n`);

    return mapped;
  } catch (err) {
    console.error("Erro ao chamar Ticketmaster:", err.message);
    return [];
  }
}

module.exports = { fetchConcerts };
