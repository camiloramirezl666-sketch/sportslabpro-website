module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body;
  const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD;

  if (!MANAGER_PASSWORD || password !== MANAGER_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token no configurado' });

  try {
    let records = [];
    let offset = null;

    do {
      const url = new URL(`https://api.airtable.com/v0/appGFSW8qbca5MmEi/tblqkA7jzYJK6Au3M`);
      url.searchParams.set('sort[0][field]', 'Fecha de envío');
      url.searchParams.set('sort[0][direction]', 'desc');
      url.searchParams.set('pageSize', '100');
      if (offset) url.searchParams.set('offset', offset);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) return res.status(500).json({ error: 'Airtable error', detail: data });

      records = records.concat(data.records || []);
      offset = data.offset || null;
    } while (offset);

    return res.status(200).json({ records });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
