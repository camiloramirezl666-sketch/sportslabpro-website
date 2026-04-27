module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token no configurado' });

  try {
    const response = await fetch(
      'https://api.airtable.com/v0/appGFSW8qbca5MmEi/tblqkA7jzYJK6Au3M',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: req.body })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Airtable error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
};
