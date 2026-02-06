import { LiveGate } from "@/components/live-gate"

export default function LivePage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Fila de Placas</h1>
      <LiveGate />
    </div>
  )
}
