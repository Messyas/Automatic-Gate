import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { plate: string } }
) {
  const { plate } = await params;   
  const base = process.env.BACKEND_URL ?? "http://localhost:3000";
  const res = await fetch(
    `${base}/cars/${plate}/release`,
    { method: "POST" }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
