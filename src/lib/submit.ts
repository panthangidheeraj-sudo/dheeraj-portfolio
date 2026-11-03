// Form delivery.
// • With VITE_WEB3FORMS_KEY set, messages are POSTed to Web3Forms, which emails them to the inbox tied to that key.
//   (The key is public by design — no secrets live in the frontend.)
// • Without it, the visitor's email app opens with the message already written. The UI says so honestly;
//   it never shows a "sent" state for something that wasn't sent.

export type SendResult = { mode: 'sent' } | { mode: 'mailto'; href: string };

const KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

export async function sendMessage(opts: {
  to: string;
  subject: string;
  fromName: string;
  replyTo: string;
  fields: Record<string, string>;
  botcheck?: string;
}): Promise<SendResult> {
  if (opts.botcheck) return { mode: 'sent' }; // honeypot filled: silently drop bots
  const body = Object.entries(opts.fields)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n\n');

  if (KEY) {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: KEY, subject: opts.subject, from_name: opts.fromName, replyto: opts.replyTo, botcheck: '', message: body, ...opts.fields })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || 'Delivery failed');
    return { mode: 'sent' };
  }

  const href = `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(opts.subject)}&body=${encodeURIComponent(body)}`;
  return { mode: 'mailto', href };
}

export const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
