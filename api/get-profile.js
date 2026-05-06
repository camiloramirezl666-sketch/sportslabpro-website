module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token no configurado' });

  try {
    const formula = encodeURIComponent(`{Correo}="${email.toLowerCase().trim()}"`);
    const url = `https://api.airtable.com/v0/appGFSW8qbca5MmEi/tblqkA7jzYJK6Au3M?filterByFormula=${formula}&maxRecords=1&sort[0][field]=Fecha%20de%20env%C3%ADo&sort[0][direction]=desc`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) return res.status(500).json({ error: 'Airtable error', detail: data });

    if (!data.records || data.records.length === 0) {
      return res.status(200).json({ found: false });
    }

    return res.status(200).json({ found: true, fields: data.records[0].fields });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
