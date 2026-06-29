import { NextResponse } from "next/server";

// GET /api/google-books?q=QUERY
// Proxy server-side para evitar bloqueios CORS/rede no browser.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "Parâmetro q obrigatório." }, { status: 400 });
  }

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`;
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      return NextResponse.json({ error: `Google Books retornou ${res.status}.` }, { status: 502 });
    }

    const json = await res.json();
    return NextResponse.json({ items: json.items ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
