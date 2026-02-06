"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { CarDto } from "@/lib/api"
import { fetchCars, releaseCar } from "@/lib/api"

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function LiveGate() {
  const { toast } = useToast()
  const qc = useQueryClient()

  /* --- Query: lista de carros --- */
  const {
    data: cars = [],
    isLoading,
    error,
  } = useQuery<CarDto[], Error>({
    queryKey: ["cars", "all"],
    queryFn: fetchCars,
    refetchInterval: 10_000,
  })

  /* --- Mutation: liberar carro --- */
  const releaseMutation = useMutation<
    { allowed: boolean }, // TData
    Error,                // TError
    string                // TVariables (plate)
  >({
    mutationFn: releaseCar,
    onSuccess: () => {
      toast({
        title: "Placa liberada",
        description: "O veículo foi liberado com sucesso.",
      })
      qc.invalidateQueries({ queryKey: ["cars", "all"] })
    },
    onError: (err) =>
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      }),
  })

  /* --- seleciona primeiro pendente --- */
  const pending = cars.find(
    (c) => c.registered && c.updatedAt === c.createdAt
  )

  /* --- últimas 5 detecções --- */
  const recent = [...cars]
    .sort(
      (a, b) =>
        +new Date(b.createdAt) - +new Date(a.createdAt)
    )
    .slice(0, 5)

  if (isLoading) return <div>Carregando…</div>
  if (error) return <div>Erro: {error.message}</div>

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* CARD PENDENTE */}
      <section>
        {pending ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-lg font-medium mb-2">
                Veículo Detectado
              </h2>
              <div className="text-5xl font-mono font-bold bg-muted p-6 rounded-md mb-4">
                {formatPlate(pending.plate)}
              </div>
              <Badge variant="outline" className="mb-4">
                Detectado{" "}
                {formatDistanceToNow(new Date(pending.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </Badge>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() =>
                  releaseMutation.mutate(pending.plate)
                }
                disabled={releaseMutation.isPending}
              >
                {releaseMutation.isPending
                  ? "Liberando…"
                  : "Liberar Passagem"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-lg font-medium mb-4">
                Nenhum veículo aguardando liberação
              </h2>
            </CardContent>
          </Card>
        )}
      </section>

      {/* TABELA HISTÓRICO */}
      <section>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-medium mb-4">
              Histórico Recente
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">
                      {formatPlate(c.plate)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(c.createdAt), "HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      {c.updatedAt !== c.createdAt ? (
                        <Badge variant="success">Liberado</Badge>
                      ) : (
                        <Badge variant="outline">Em análise</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

/* Auxiliar */
function formatPlate(p: string) {
  return p.length === 7 ? `${p.slice(0, 3)}-${p.slice(3)}` : p
}
