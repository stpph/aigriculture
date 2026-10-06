// api/copernicus.js

let cachedToken = null;
let tokenExpiresAt = 0;

async function getCopernicusToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.COPERNICUS_CLIENT_ID;
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Lipsește COPERNICUS_CLIENT_ID sau COPERNICUS_CLIENT_SECRET din variabilele de mediu Vercel.');
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
  if (!res.ok) {
    throw new Error('Eroare autentificare CDSE: ' + (data.error_description || JSON.stringify(data)));
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

const EVALSCRIPT_NDVI = `
//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(sample) {
  if (sample.dataMask === 0) return [0, 0, 0, 0];
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  if (ndvi < 0.1) return [0.36, 0.23, 0.12, 1];
  if (ndvi < 0.3) return [0.77, 0.50, 0.17, 1];
  if (ndvi < 0.5) return [0.94, 0.85, 0.29, 1];
  if (ndvi < 0.7) return [0.61, 0.83, 0.35, 1];
  return [0.18, 0.62, 0.29, 1];
}
`;

export default async function handler(req, res) {
  try {
    const { bbox, data } = req.query; 
    if (!bbox || !data) {
      return res.status(400).json({ error: 'Lipsește parametrul bbox sau data.' });
    }

    const bboxArray = bbox.split(',').map(Number);
    if (bboxArray.length !== 4 || bboxArray.some(isNaN)) {
      return res.status(400).json({ error: 'Format bbox invalid.' });
    }

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
              timeRange: {
                from: `${data}T00:00:00Z`,
                to: `${data}T23:59:59Z`
              },
              maxCloudCoverage: 50
            }
          }]
        },
        output: {
          width: 512,
          height: 512,
          responses: [{ identifier: "default", format: { type: "image/png" } }]
        },
        evalscript: EVALUSCRIPT_NDVI
      })
    });

    if (!copernicusRes.ok) {
      const errText = await copernicusRes.text();
      console.error('Copernicus Process API Error:', errText);
      return res.status(404).json({ error: 'Imagine indisponibilă pentru data respectivă.', details: errText });
    }

    const arrayBuffer = await copernicusRes.arrayBuffer();
    const base64Image = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;

    return res.status(200).json({
      url: base64Image,
      bounds: [[bboxArray[1], bboxArray[0]], [bboxArray[3], bboxArray[2]]]
    });

  } catch (err) {
    console.error('Serverless Function Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}