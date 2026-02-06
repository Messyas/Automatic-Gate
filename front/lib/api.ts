export type CarReviewStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED"

export type CarDto = {
  id: number
  plate: string
  trackId: number
  registered: boolean
  released: boolean
  reviewStatus: CarReviewStatus
  createdAt: string
  updatedAt: string
}

export type PaginatedCarsResponse = {
  data: CarDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasPrev: boolean
    hasNext: boolean
  }
}

export type ReviewFilter = "pending" | "rejected" | "all"

export async function fetchCars(): Promise<CarDto[]> {
  const res = await fetch("/api/cars")
  if (!res.ok) throw new Error("Falha ao buscar veiculos")
  return res.json()
}

export async function fetchReviewCars(
  page: number,
  limit: number,
  status: ReviewFilter,
): Promise<PaginatedCarsResponse> {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
  })
  const res = await fetch(`/api/cars/review?${qs.toString()}`)
  if (!res.ok) throw new Error("Falha ao buscar fila de revisao")
  return res.json()
}

export async function releaseCar(plate: string): Promise<{ allowed: boolean }> {
  const res = await fetch(`/api/cars/${plate}/release`, { method: "POST" })
  if (!res.ok) throw new Error("Falha ao liberar veiculo")
  return res.json()
}

export async function approveCar(plate: string): Promise<{ message: string }> {
  const res = await fetch(`/api/cars/${plate}/approve`, { method: "POST" })
  if (!res.ok) throw new Error("Falha ao aprovar veiculo")
  return res.json()
}

export async function rejectCar(plate: string): Promise<{ message: string }> {
  const res = await fetch(`/api/cars/${plate}/reject`, { method: "POST" })
  if (!res.ok) throw new Error("Falha ao recusar veiculo")
  return res.json()
}
