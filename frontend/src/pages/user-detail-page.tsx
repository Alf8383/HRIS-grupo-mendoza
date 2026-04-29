import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
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
import { apiRequest, getApiMessage } from '@/lib/http'
import type { UserDetail } from '@/types/domain'

export function UserDetailPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !id) return

    const loadUser = async () => {
      setLoading(true)
      try {
        const response = await apiRequest<UserDetail>(`/users/${id}`, { token })
        setUser(response)
      } catch (error) {
        toast.error(getApiMessage(error, 'No se pudo cargar el detalle del usuario.'))
      } finally {
        setLoading(false)
      }
    }

    void loadUser()
  }, [token, id])

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Usuarios', to: '/app/users' },
          { label: user?.fullName ?? 'Detalle' },
        ]}
      />

      <PageHeader
        title="Detalle de usuario"
        description="Consulta la información de la cuenta, su rol operativo y la relación con el registro de empleado."
        actions={
          <Button asChild type="button" variant="outline">
            <Link to="/app/users">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-3xl p-6">
            <Skeleton className="mb-4 h-8 w-64" />
            <Skeleton className="mb-6 h-4 w-48" />
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
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
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
              <Skeleton className="mt-4 h-10 w-full" />
            </div>
          </Card>
        </div>
      ) : user ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>{user.fullName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <DetailItem label="Rol" value={user.roleLabel} />
              <DetailItem label="Estado" value={<StatusBadge value={user.status} />} />
              <DetailItem label="Código de rol" value={user.role} />
              <DetailItem
                label="Cuenta vinculada"
                value={user.employee ? 'Sí' : 'No'}
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Vinculación con empleado</CardTitle>
              <CardDescription>Resumen del registro asociado, si existe.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.employee ? (
                <div className="space-y-4">
                  <DetailItem label="DNI" value={user.employee.dni} />
                  <DetailItem label="Cargo" value={user.employee.positionName} />
                  <DetailItem label="Área" value={user.employee.areaName} />
                  <DetailItem label="Sede" value={user.employee.siteName} />
                  <DetailItem label="Estado del empleado" value={<StatusBadge value={user.employee.status} />} />
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/app/employees/${user.employee.employeeId}`}>Ver empleado vinculado</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Esta cuenta no tiene un registro de empleado asociado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="rounded-3xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No se encontró el usuario solicitado.
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
