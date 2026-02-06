import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const base = process.env.BACKEND_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/cars/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
