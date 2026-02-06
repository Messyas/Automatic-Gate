import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { plate: string } }
) {
  const { plate } = params;
  const base = process.env.BACKEND_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/cars/${plate}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
