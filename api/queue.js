async function getDriverAccessToken() {
  const basic = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + basic,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=refresh_token&refresh_token=' + process.env.SPOTIFY_REFRESH_TOKEN
  });

  if (!res.ok) {
    throw new Error('No se pudo renovar el token del conductor');
  }

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  const uri = req.body.uri;
  if (!uri) {
    return res.status(400).json({ error: 'Falta el uri de la cancion' });
  }

  try {
    const accessToken = await getDriverAccessToken();

    const queueRes = await fetch(
      'https://api.spotify.com/v1/me/player/queue?uri=' + encodeURIComponent(uri),
      {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + accessToken }
      }
    );

    if (queueRes.ok) {
      return res.status(200).json({ ok: true });
    }

    if (queueRes.status === 404) {
      return res.status(409).json({
        error: 'No hay ningun dispositivo activo reproduciendo Spotify ahora mismo'
      });
    }

    return res.status(500).json({ error: 'No se pudo agregar la cancion' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
