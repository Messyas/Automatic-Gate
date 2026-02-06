import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const base = process.env.BACKEND_URL ?? "http://localhost:3000"
  const url = new URL(request.url)
  const search = url.searchParams.toString()
  const path = search ? `/cars/review?${search}` : "/cars/review"

  const res = await fetch(`${base}${path}`, {
    method: "GET",
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
