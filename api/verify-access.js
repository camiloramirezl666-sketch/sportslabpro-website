module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token no configurado' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ authorized: false, error: 'Email requerido' });

  try {
    const filter = encodeURIComponent(`AND({Email}="${email.toLowerCase().trim()}", {Activo}=1)`);
    const response = await fetch(
      `https://api.airtable.com/v0/appGFSW8qbca5MmEi/tblGDTCoJhC3kx7Ge?filterByFormula=${filter}&maxRecords=1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Airtable error:', data);
      return res.status(500).json({ authorized: false });
    }

    const authorized = data.records && data.records.length > 0;
    return res.status(200).json({ authorized });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ authorized: false, error: error.message });
  }
};
