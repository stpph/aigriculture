// api/copernicus.js

let cachedToken = null;
let tokenExpiresAt = 0;

/* ---------- EVALSCRIPTS PENTRU FIECARE INDICE ---------- */
const EVALSCRIPTS = {
  ndvi: `
  //VERSION=3
  function setup() {
    return { input: ["B04", "B08", "dataMask"], output: { bands: 4 } };
  }
  function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    let v = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
    if (v < 0.1) return [0.36, 0.23, 0.12, 1];
    if (v < 0.3) return [0.77, 0.50, 0.17, 1];
    if (v < 0.5) return [0.94, 0.85, 0.29, 1];
    if (v < 0.7) return [0.61, 0.83, 0.35, 1];
    return [0.18, 0.62, 0.29, 1];
  }`,

  ndre: `
  //VERSION=3
  function setup() {
    return { input: ["B05", "B08", "dataMask"], output: { bands: 4 } };
  }
  function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    let v = (sample.B08 - sample.B05) / (sample.B08 + sample.B05);
    if (v < 0.05) return [0.36, 0.23, 0.12, 1];
    if (v < 0.2)  return [0.77, 0.50, 0.17, 1];
    if (v < 0.35) return [0.94, 0.85, 0.29, 1];
    if (v < 0.5)  return [0.61, 0.83, 0.35, 1];
    return [0.18, 0.62, 0.29, 1];
  }`,

  ndmi: `
  //VERSION=3
  function setup() {
    return { input: ["B08", "B11", "dataMask"], output: { bands: 4 } };
  }
  function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    let v = (sample.B08 - sample.B11) / (sample.B08 + sample.B11);
    if (v < -0.2) return [0.55, 0.32, 0.04, 1];
    if (v < 0.0)  return [0.85, 0.70, 0.39, 1];
    if (v < 0.2)  return [0.96, 0.91, 0.76, 1];
    if (v < 0.4)  return [0.50, 0.80, 0.76, 1];
    return [0.00, 0.40, 0.37, 1];
  }`,

  rgb: `
  //VERSION=3
  function setup() {
    return { input: ["B02", "B03", "B04", "dataMask"], output: { bands: 4 } };
  }
  function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5, 1];
  }`
};

async function getCopernicusToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.COPERNICUS_CLIENT_ID;
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Lipsește COPERNICUS_CLIENT_ID sau COPERNICUS_CLIENT_SECRET.');
  }

  const res = await fetch('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error('Eroare autentificare CDSE');

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  try {
    const { bbox, data, indice } = req.query; 
    if (!bbox || !data) return res.status(400).json({ error: 'Lipsește bbox sau data.' });

    const bboxArray = bbox.split(',').map(Number);
    if (bboxArray.length !== 4 || bboxArray.some(isNaN)) {
      return res.status(400).json({ error: 'Format bbox invalid.' });
    }

    const evalscript = EVALSCRIPTS[indice] || EVALSCRIPTS.ndvi;

    // Fereastră flexibilă de +/- 3 zile în jurul datei selectate
    const targetDate = new Date(data);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 3);

    const fromIso = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const toIso = endDate.toISOString().split('T')[0] + 'T23:59:59Z';

    const token = await getCopernicusToken();

    const copernicusRes = await fetch('https://sh.dataspace.copernicus.eu/api/v1/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          bounds: {
            bbox: bboxArray,
            properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" }
          },
          data: [{
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: { from: fromIso, to: toIso },
              maxCloudCoverage: 80,
              mosaickingOrder: "mostRecent"
            }
          }]
        },
        output: {
          width: 512,
          height: 512,
          responses: [{ identifier: "default", format: { type: "image/png" } }]
        },
        evalscript: evalscript
      })
    });

    if (!copernicusRes.ok) {
      return res.status(404).json({ error: 'Nu există imagini disponibile pentru perioada respectivă.' });
    }

    const arrayBuffer = await copernicusRes.arrayBuffer();
    const base64Image = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;

    return res.status(200).json({
      url: base64Image,
      bounds: [[bboxArray[1], bboxArray[0]], [bboxArray[3], bboxArray[2]]]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}