// api/meteo.js

export default async function handler(req, res) {
  try {
    const { lat, lng, startDate, endDate } = req.query;

    if (!lat || !lng || !startDate || !endDate) {
      return res.status(400).json({ error: 'Lipsește lat, lng, startDate sau endDate.' });
    }

    // Interogăm API-ul gratuit Open-Meteo Archive
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum&timezone=auto`;

    const r = await fetch(url);
    if (!r.ok) throw new Error('Eroare la preluarea datelor meteo.');

    const data = await r.json();

    // Returnăm un array de obiecte: { data: 'YYYY-MM-DD', precipitatii: mm }
    const rezultate = data.daily.time.map((d, index) => ({
      data: d,
      precipitatii: data.daily.precipitation_sum[index] || 0
    }));

    return res.status(200).json(rezultate);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}