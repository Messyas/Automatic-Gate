"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"

import {
  approveCar,
  fetchReviewCars,
  rejectCar,
  ReviewFilter,
  type CarDto,
} from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

const LIMIT = 8

export function ReviewQueue() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<ReviewFilter>("pending")
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ["cars", "review", page, filter],
    queryFn: () => fetchReviewCars(page, LIMIT, filter),
    placeholderData: (prev) => prev,
  })

  const approveMutation = useMutation({
    mutationFn: approveCar,
    onSuccess: (result) => {
      toast({ title: "Veiculo liberado", description: result.message })
      qc.invalidateQueries({ queryKey: ["cars", "review"] })
      qc.invalidateQueries({ queryKey: ["cars", "all"] })
    },
    onError: (err: Error) => {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectCar,
    onSuccess: (result) => {
      toast({ title: "Veiculo recusado", description: result.message })
      qc.invalidateQueries({ queryKey: ["cars", "review"] })
      qc.invalidateQueries({ queryKey: ["cars", "all"] })
    },
    onError: (err: Error) => {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      })
    },
  })

  const items = useMemo(() => data?.data ?? [], [data?.data])
  const meta = data?.meta

  const isWorking = approveMutation.isPending || rejectMutation.isPending

  if (isLoading) return <div>Carregando...</div>
  if (error instanceof Error) return <div>Erro: {error.message}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fila de Revisao da Portaria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => {
              setFilter("pending")
              setPage(1)
            }}
          >
            Pendentes
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => {
              setFilter("rejected")
              setPage(1)
            }}
          >
            Recusados
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => {
              setFilter("all")
              setPage(1)
            }}
          >
            Todos
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Track ID</TableHead>
              <TableHead>Detectado em</TableHead>
              <TableHead className="text-right">Acao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((car) => (
              <TableRow key={car.id}>
                <TableCell className="font-mono">{formatPlate(car.plate)}</TableCell>
                <TableCell>{renderStatus(car)}</TableCell>
                <TableCell>{car.trackId}</TableCell>
                <TableCell>{format(new Date(car.createdAt), "dd/MM/yyyy HH:mm:ss")}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(car.plate)}
                    disabled={isWorking}
                  >
                    Cadastrar placa
                  </Button>
                  {car.reviewStatus !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(car.plate)}
                      disabled={isWorking}
                    >
                      Recusar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhum veiculo para revisao.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {meta?.page ?? 1} de {meta?.totalPages ?? 1} ({meta?.total ?? 0} itens)
          </p>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage((curr) => Math.max(1, curr - 1))}
              disabled={!meta?.hasPrev}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((curr) => curr + 1)}
              disabled={!meta?.hasNext}
            >
              Proxima
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function renderStatus(car: CarDto) {
  if (car.reviewStatus === "PENDING_REVIEW") {
    return <Badge variant="outline">Aguardando analise</Badge>
  }
  if (car.reviewStatus === "REJECTED") {
    return <Badge variant="destructive">Recusado</Badge>
  }
  return <Badge variant="success">Aprovado</Badge>
}

function formatPlate(plate: string) {
  return plate.length === 7 ? `${plate.slice(0, 3)}-${plate.slice(3)}` : plate
}
