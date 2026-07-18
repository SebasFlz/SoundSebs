export default async function handler(req, res) {
  const code = req.query.code;
  const error = req.query.error;

  if (error) {
    return res.status(400).send('Error de autorizacion: ' + error);
  }

  const redirectUri = 'https://' + req.headers.host + '/api/callback';
  const basic = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
  ).toString('base64');

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + basic,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(500).send('Error: ' + JSON.stringify(data));
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(
      '<html><body style="font-family: sans-serif; background:#121212; color:#fff; padding:24px;">' +
      '<h2>Autorizacion exitosa</h2>' +
      '<p>Copia este valor y guardalo como variable de entorno SPOTIFY_REFRESH_TOKEN en Vercel:</p>' +
      '<textarea style="width:100%; height:80px; font-size:14px; padding:10px;">' + data.refresh_token + '</textarea>' +
      '<p style="color:#f55; margin-top:16px;">No compartas este codigo con nadie.</p>' +
      '</body></html>'
    );
  } catch (e) {
    res.status(500).send('Error: ' + e.message);
  }
}
