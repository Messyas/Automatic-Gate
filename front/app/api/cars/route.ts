import { NextResponse } from "next/server"

export async function GET() {
  const base = process.env.BACKEND_URL ?? "http://localhost:3000"
  const res = await fetch(`${base}/cars`, {
    method: "GET",
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
