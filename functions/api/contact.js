export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://tap.getmovelle.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await context.request.json();
    const { name, email, phone, tier, message } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const tierLabel = tier || 'Not specified';
    const phoneLabel = phone || 'Not provided';
    const messageLabel = message || 'No message';

    const htmlBody = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 0">
        <div style="border-bottom:2px solid #2563eb;padding-bottom:16px;margin-bottom:24px">
          <h2 style="margin:0;color:#111827;font-size:20px">New Movelle inquiry</h2>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:15px;color:#374151">
          <tr><td style="padding:10px 0;font-weight:600;width:100px;vertical-align:top">Name</td><td style="padding:10px 0">${name}</td></tr>
          <tr><td style="padding:10px 0;font-weight:600;vertical-align:top">Email</td><td style="padding:10px 0"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
          <tr><td style="padding:10px 0;font-weight:600;vertical-align:top">Phone</td><td style="padding:10px 0">${phoneLabel}</td></tr>
          <tr><td style="padding:10px 0;font-weight:600;vertical-align:top">Tier</td><td style="padding:10px 0;color:#2563eb;font-weight:500">${tierLabel}</td></tr>
          <tr><td style="padding:10px 0;font-weight:600;vertical-align:top">Message</td><td style="padding:10px 0">${messageLabel}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
          From tap.getmovelle.com contact form
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Movelle <hello@mail.getmovelle.com>',
        to: ['pablo@najera.co'],
        reply_to: email,
        subject: `Movelle inquiry — ${name} (${tierLabel})`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send. Try emailing directly.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (e) {
    console.error('Contact function error:', e);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://tap.getmovelle.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
