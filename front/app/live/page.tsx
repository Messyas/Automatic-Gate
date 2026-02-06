import { LiveGate } from "@/components/live-gate"

export default function LivePage() {
  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <h1 className="text-3xl font-bold mb-6">Fila de Placas</h1>
      <LiveGate />
    </div>
  )
}
