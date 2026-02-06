export type CarDto = {
  id: number
  plate: string
  trackId: number
  registered: boolean
  createdAt: string
  updatedAt: string
}
  export async function fetchCars(): Promise<CarDto[]> {
    const res = await fetch("/api/cars")
    if (!res.ok) throw new Error("Falha ao buscar veículos")
    return res.json()
  }
  
  export async function releaseCar(plate: string): Promise<{ allowed: boolean }> {
    const res = await fetch(`/api/cars/${plate}/release`, { method: "POST" })
    if (!res.ok) throw new Error("Falha ao liberar veículo")
    return res.json()
}