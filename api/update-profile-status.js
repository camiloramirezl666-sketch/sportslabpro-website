module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, recordId, status, reviewedBy, notes } = req.body;
  const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD;

  if (!MANAGER_PASSWORD || password !== MANAGER_PASSWORD) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (!recordId) return res.status(400).json({ error: 'recordId requerido' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token no configurado' });

  const patchAirtable = async (fields) => {
    const response = await fetch(
      `https://api.airtable.com/v0/appGFSW8qbca5MmEi/tblqkA7jzYJK6Au3M/${recordId}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, typecast: true })
      }
    );
    return { ok: response.ok, data: await response.json() };
  };

  try {
    // Intentar con todos los campos
    const allFields = {};
    if (status) allFields['Estado del perfil'] = status;
    if (reviewedBy !== undefined) allFields['Revisado por'] = reviewedBy;
    if (notes !== undefined) allFields['Notas del manager'] = notes;
    allFields['Ultima actualizacion'] = new Date().toISOString();

    let result = await patchAirtable(allFields);

    // Si falla (campos no existen aun), reintentar solo con Estado del perfil
    if (!result.ok) {
      const fallback = {};
      if (status) fallback['Estado del perfil'] = status;
      result = await patchAirtable(fallback);
    }

    if (!result.ok) return res.status(500).json({ error: 'Airtable error', detail: result.data });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
