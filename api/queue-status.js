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

function mapTrack(t) {
  if (!t) return null;
  return {
    uri: t.uri,
    name: t.name,
    artist: (t.artists || []).map(function(a) { return a.name; }).join(', '),
    image: (t.album && t.album.images && t.album.images[2]) ? t.album.images[2].url : ((t.album && t.album.images && t.album.images[0]) ? t.album.images[0].url : '')
  };
}

export default async function handler(req, res) {
  try {
    const accessToken = await getDriverAccessToken();

    const queueRes = await fetch('https://api.spotify.com/v1/me/player/queue', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });

    if (!queueRes.ok) {
      return res.status(500).json({ error: 'No se pudo obtener la cola' });
    }

    const data = await queueRes.json();

    res.status(200).json({
      currentlyPlaying: mapTrack(data.currently_playing),
      queue: (data.queue || []).map(mapTrack).filter(Boolean)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
