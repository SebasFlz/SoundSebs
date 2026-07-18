let cachedToken = null;
let tokenExpiresAt = 0;

async function getAppToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  const basic = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + basic,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    throw new Error('No se pudo obtener token de Spotify');
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parametro q' });
  }

  try {
    const token = await getAppToken();
    const searchRes = await fetch(
      'https://api.spotify.com/v1/search?q=' + encodeURIComponent(query) + '&type=track&limit=10',
      { headers: { 'Authorization': 'Bearer ' + token } }
    );

    if (!searchRes.ok) {
      return res.status(500).json({ error: 'Error al buscar en Spotify' });
    }

    const data = await searchRes.json();
    const tracks = (data.tracks && data.tracks.items ? data.tracks.items : []).map(function(t) {
      return {
        uri: t.uri,
        name: t.name,
        artist: t.artists.map(function(a) { return a.name; }).join(', '),
        image: (t.album && t.album.images && t.album.images[2]) ? t.album.images[2].url : ((t.album && t.album.images && t.album.images[0]) ? t.album.images[0].url : '')
      };
    });

    res.status(200).json({ tracks: tracks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
