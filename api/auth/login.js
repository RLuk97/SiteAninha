export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Método não permitido' });
    return;
  }
  const ADMIN_USER = process.env.ADMIN_USER || 'AnaSantos';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'Asantos1969';
  const { user = '', pass = '' } = req.body || {};
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    res.status(200).json({ ok: true, message: 'Login realizado' });
  } else {
    res.status(401).json({ ok: false, message: 'Usuário ou senha incorretos' });
  }
}
