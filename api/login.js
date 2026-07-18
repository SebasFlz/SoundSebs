export default function handler(req, res) {
  const scope = 'user-modify-playback-state';
  const redirectUri = 'https://' + req.headers.host + '/api/callback';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: redirectUri
  });

  res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
}
