import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

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
import { useAuth } from '@/contexts/auth-context'
import { formatDate } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
import type { EmployeeDetail } from '@/types/domain'

export function EmployeeDetailPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !id) return

    const loadEmployee = async () => {
      setLoading(true)
      try {
        const response = await apiRequest<EmployeeDetail>(`/employees/${id}`, {
          token,
        })
        setEmployee(response)
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
        <Card className="rounded-3xl">
          <CardContent className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Cargando detalle...
          </CardContent>
        </Card>
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


