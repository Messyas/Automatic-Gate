import { ReviewQueue } from "@/components/review-queue"

export default function ReviewPage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Revisao da Portaria</h1>
      <ReviewQueue />
    </div>
  )
}
