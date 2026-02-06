import { ReviewQueue } from "@/components/review-queue"

export default function ReviewPage() {
  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <h1 className="text-3xl font-bold mb-6">Revisao da Portaria</h1>
      <ReviewQueue />
    </div>
  )
}
