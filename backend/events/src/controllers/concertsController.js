const { fetchConcerts } = require("../services/ticketmasterService");
const { createConcert } = require("../model/concertsModel");

async function saveConcerts(req, res) {
  try {
    // Aceitar parâmetros de query ou body
    const country = req.query.country || req.body?.country || null;
    const date = req.query.date || req.body?.date || null;
    const size = req.query.size || req.body?.size || 20;

    console.log(`📡 Sincronizando concertos...`);
    if (country) console.log(`   País: ${country}`);
    if (date) console.log(`   Data: ${date}`);
    console.log(`   Quantidade: ${size}`);

    const concerts = await fetchConcerts(country, date, parseInt(size));

    for (const concert of concerts) {
      await createConcert(concert);
    }

    res.json({
      sucesso: true,
      mensagem: "Concertos sincronizados com sucesso",
      total: concerts.length,
      filtros: {
        pais: country || "Padrão (US)",
        data: date || "A partir de hoje",
        quantidade: size,
      },
    });
  } catch (err) {
    console.error("❌ Erro:", err);
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao sincronizar concertos",
      detalhes: err.message,
    });
  }
}

module.exports = { saveConcerts };
