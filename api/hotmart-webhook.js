module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // Solo procesar compras aprobadas
    const event = body.event;
    if (event !== 'PURCHASE_APPROVED' && event !== 'PURCHASE_COMPLETE') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const buyer = body.data?.buyer;
    const offer = body.data?.purchase?.offer;

    if (!buyer?.email) {
      return res.status(400).json({ error: 'No buyer email' });
    }

    const email = buyer.email.toLowerCase().trim();
    const nombre = buyer.name || '';
    const offerCode = offer?.code || '';

    // Solo agregar a Compradores si compraron el plan completo ($39.99)
    // Offer code: jucrwn4q
    // Si no tiene offer code (compra base $14.99), no agregamos
    if (offerCode && offerCode !== 'jucrwn4q') {
      return res.status(200).json({ ok: true, skipped: 'not profile offer' });
    }

    // Si es jucrwn4q o no hay offer (por si acaso), agregar a Airtable
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = 'appGFSW8qbca5MmEi';
    const TABLE_ID = 'tblGDTCoJhC3kx7Ge';

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Email: email,
            Nombre: nombre,
            Plan: 'Curso + Perfil ($39.99)',
            Activo: true,
          },
        }),
      }
    );

    if (!airtableRes.ok) {
      const err = await airtableRes.text();
      console.error('Airtable error:', err);
      return res.status(500).json({ error: 'Airtable failed', detail: err });
    }

    return res.status(200).json({ ok: true, email });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
};
