import { useEffect, useState } from 'react'
import { ArrowLeft, FileBadge2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Breadcrumb } from '@/components/app/breadcrumb'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { formatDate } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
import type { ContractRecord, EmployeeDetail } from '@/types/domain'

export function EmployeeDetailPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !id) return

    const loadEmployee = async () => {
      setLoading(true)
      try {
        const [employeeResponse, contractsResponse] = await Promise.all([
          apiRequest<EmployeeDetail>(`/employees/${id}`, {
            token,
          }),
          apiRequest<ContractRecord[]>(`/contracts/employee/${id}`, {
            token,
          }),
        ])
        setEmployee(employeeResponse)
        setContracts(contractsResponse)
      } catch (error) {
        toast.error(getApiMessage(error, 'No se pudo cargar el detalle del empleado.'))
      } finally {
        setLoading(false)
      }
    }

    void loadEmployee()
  }, [token, id])

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Empleados', to: '/app/employees' },
          { label: employee?.fullName ?? 'Detalle' },
        ]}
      />

      <PageHeader
        title="Detalle de empleado"
        description="Consulta la ficha principal del colaborador, su rol y su asignación organizacional."
        actions={
          <Button asChild type="button" variant="outline">
            <Link to="/app/employees">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-3xl p-6">
            <Skeleton className="mb-4 h-8 w-64" />
            <Skeleton className="mb-6 h-4 w-48" />
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-3xl p-6">
            <Skeleton className="mb-4 h-8 w-48" />
            <Skeleton className="mb-6 h-4 w-56" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
              <Skeleton className="mt-4 h-10 w-full" />
            </div>
          </Card>
        </div>
      ) : employee ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>{employee.fullName}</CardTitle>
              <CardDescription>{employee.email}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <DetailItem label="DNI" value={employee.dni} />
              <DetailItem label="Teléfono" value={employee.phone || 'Sin registro'} />
              <DetailItem label="Fecha de ingreso" value={formatDate(employee.hireDate)} />
              <DetailItem label="Rol" value={employee.roleLabel} />
              <DetailItem label="Área" value={employee.areaName} />
              <DetailItem label="Cargo" value={employee.positionName} />
              <DetailItem label="Sede" value={employee.siteName} />
              <DetailItem label="Estado del empleado" value={<StatusBadge value={employee.employeeStatus} />} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Cuenta asociada</CardTitle>
              <CardDescription>Resumen de la cuenta de acceso vinculada al empleado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem label="Estado de la cuenta" value={<StatusBadge value={employee.userStatus} />} />
              <DetailItem label="Código de rol" value={employee.role} />
              <DetailItem label="Correo de acceso" value={employee.email} />
              <Button asChild className="w-full" variant="outline">
                <Link to={`/app/users/${employee.userId}`}>Ver cuenta vinculada</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl xl:col-span-2">
            <CardHeader>
              <CardTitle>Vacaciones</CardTitle>
              <CardDescription>
                Resumen del saldo actual asociado al empleado.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <VacationStat
                label="Disponibles"
                value={employee.vacationAvailableDays}
              />
              <VacationStat label="Usados" value={employee.vacationUsedDays} />
              <VacationStat
                label="Pendientes"
                value={employee.vacationPendingDays}
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl xl:col-span-2">
            <CardHeader>
              <CardTitle>Historial contractual</CardTitle>
              <CardDescription>
                Vigencia y renovaciones registradas para este colaborador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contracts.length ? (
                <div className="overflow-hidden rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Tipo</th>
                        <th className="px-4 py-3 font-medium">Vigencia</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract) => (
                        <tr key={contract.id} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-3 align-top">
                            <p className="font-medium">{getContractTypeLabel(contract.contractType)}</p>
                            {contract.previousContractId ? (
                              <p className="text-xs text-muted-foreground">
                                Renovación de #{contract.previousContractId}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <p>{formatDate(contract.startDate)}</p>
                            <p className="text-muted-foreground">
                              {contract.endDate ? formatDate(contract.endDate) : 'Sin fecha fin'}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <StatusBadge value={contract.status} />
                          </td>
                          <td className="px-4 py-3 align-top">
                            {contract.notes ?? 'Sin notas'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                  <FileBadge2 className="mx-auto mb-3 size-5" />
                  No hay contratos registrados para este empleado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="rounded-3xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No se encontró el empleado solicitado.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function VacationStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function getContractTypeLabel(value: string) {
  switch (value) {
    case 'FIXED_TERM':
      return 'Plazo fijo'
    case 'INDEFINITE':
      return 'Indefinido'
    case 'TEMPORARY':
      return 'Temporal'
    case 'INTERNSHIP':
      return 'Prácticas'
    default:
      return value
  }
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}
