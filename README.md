# Minidu & Maleesha — Homecoming Invitation

**29 December 2026 · 7:00 PM – 12:00 AM · Hotel Randika, Kuliyapitiya Rd, Udubaddawa**
RSVP: 077 707 3573

## Run locally

```bash
npm install
npm run dev
```

## Editing details

All names, parents, date, venue and RSVP contacts live in [`src/config.ts`](src/config.ts).

## Personalised links — `/admin`

Open `/admin`, pick a prefix (Mr., Mrs., Miss, Mr. & Mrs., Family, Dear), type the guest name and click **Generate Link**.
Links look like `https://your-domain/Mr.%20Sanjaya`; the invitation then shows
"We cordially invite Mr. Sanjaya to celebrate our special day with us."

## RSVP & Wishes → Google Sheets

1. Open the [spreadsheet](https://docs.google.com/spreadsheets/d/1G-Eo3ADFbubeCdgkmaK1xERV7aIQKiSt6azTLjq5ZYg/edit) → **Extensions → Apps Script**.
2. Paste the contents of [`code.gs`](code.gs), save, and run `setup` once (creates the **RSVP** and **Wishes** sheets with headers).
3. **Deploy → New deployment → Web app** — Execute as *Me*, access *Anyone*. Copy the `/exec` URL.
4. Set it as `VITE_GOOGLE_SCRIPT_URL` (Vercel → Project → Settings → Environment Variables, or a local `.env`), then redeploy.

Until the URL is set, the forms only simulate a successful submission.
