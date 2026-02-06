"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, subDays, isAfter, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import saveAs from "file-saver"
import Papa from "papaparse"

import type { CarDto } from "@/lib/api"
import { fetchCars } from "@/lib/api"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, LineChart, Line } from "recharts"
import { CalendarIcon, Download } from "lucide-react"
import { cn } from "@/lib/utils"

type DateRange = {
  from: Date
  to: Date
}

export function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  const { data: cars = [], isLoading, error } = useQuery<CarDto[], Error>({
    queryKey: ["cars", "all"],
    queryFn: fetchCars,
  })

  const filteredCars = cars.filter((car) => {
    const dt = parseISO(car.createdAt)
    return isAfter(dt, dateRange.from) && !isAfter(dt, dateRange.to)
  })

  const chartData = prepareChartData(filteredCars, dateRange)
  const tableData = prepareTableData(filteredCars)

  const handleExportCSV = () => {
    const csvData = tableData.map((item) => ({
      Placa: item.plate,
      "Primeira Detecção": format(parseISO(item.firstSeen), "dd/MM/yyyy HH:mm:ss"),
      "Última Liberação": item.lastReleased
        ? format(parseISO(item.lastReleased), "dd/MM/yyyy HH:mm:ss")
        : "N/A",
      "Vezes Liberado": item.timesReleased,
    }))
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    saveAs(blob, `gate-keeper-export-${format(new Date(), "yyyy-MM-dd")}.csv`)
  }

  const handlePreset = (days: number) =>
    setDateRange({ from: subDays(new Date(), days), to: new Date() })

  return (
    <div className="space-y-8">
      {/* filtros */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {[7, 30].map((d) => (
              <Button
                key={d}
                variant="outline"
                size="sm"
                onClick={() => handlePreset(d)}
                className={cn(
                  dateRange.from.getTime() === subDays(new Date(), d).setHours(0, 0, 0, 0)
                    ? "bg-primary text-primary-foreground"
                    : ""
                )}
              >
                {d} dias
              </Button>
            ))}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(r) => r?.from && r?.to && setDateRange(r)}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {/* gráficos */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Veículos por Dia</CardTitle>
            <CardDescription>Contagem diária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] 2xl:h-[380px]">
              <ChartContainer config={{ vehicles: { label: "Veículos" } }}>
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd/MM")} axisLine={false} />
                  <YAxis axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar type="monotone" dataKey="vehicles" radius={4} fill="#3b82f6" />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acumulado no Período</CardTitle>
            <CardDescription>Soma acumulada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] 2xl:h-[380px]">
              <ChartContainer config={{ cumulative: { label: "Acumulado" } }}>
                <LineChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd/MM")} axisLine={false} />
                  <YAxis axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="cumulative" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} fill="#3b82f6"/>
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
          <CardDescription>Detalhamento por placa</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Primeira Detecção</TableHead>
                <TableHead>Última Liberação</TableHead>
                <TableHead className="text-right">Vezes Liberado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((it) => (
                <TableRow key={it.plate}>
                  <TableCell className="font-mono font-medium">{formatPlate(it.plate)}</TableCell>
                  <TableCell>{format(parseISO(it.firstSeen), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>
                    {it.lastReleased ? format(parseISO(it.lastReleased), "dd/MM/yyyy HH:mm") : "Não liberado"}
                  </TableCell>
                  <TableCell className="text-right">{it.timesReleased}</TableCell>
                </TableRow>
              ))}
              {tableData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// formata AAA1234 → AAA‑1234
function formatPlate(plate: string) {
  return plate.length === 7 ? `${plate.slice(0, 3)}-${plate.slice(3)}` : plate
}

function prepareChartData(cars: CarDto[], range: DateRange) {
  const days: Record<string, { vehicles: number; cumulative: number }> = {}
  let cur = new Date(range.from)
  while (cur <= range.to) {
    const d = format(cur, "yyyy-MM-dd")
    days[d] = { vehicles: 0, cumulative: 0 }
    cur.setDate(cur.getDate() + 1)
  }
  cars.forEach((c) => {
    const d = c.createdAt.split("T")[0]
    days[d] && days[d].vehicles++
  })
  let cum = 0
  return Object.entries(days).map(([date, dt]) => {
    cum += dt.vehicles
    return { date, vehicles: dt.vehicles, cumulative: cum }
  })
}

function prepareTableData(cars: CarDto[]) {
  const m: Record<
    string,
    { plate: string; firstSeen: string; lastReleased: string | null; timesReleased: number }
  > = {}
  cars.forEach((c) => {
    if (!m[c.plate]) m[c.plate] = { plate: c.plate, firstSeen: c.createdAt, lastReleased: null, timesReleased: 0 }
    if (new Date(c.createdAt) < new Date(m[c.plate].firstSeen)) m[c.plate].firstSeen = c.createdAt
    if (c.updatedAt !== c.createdAt) {
      m[c.plate].timesReleased++
      if (!m[c.plate].lastReleased || new Date(c.updatedAt) > new Date(m[c.plate].lastReleased!)) {
        m[c.plate].lastReleased = c.updatedAt
      }
    }
  })
  return Object.values(m)
}
