import {
  CheckCircle2,
  Database,
  Layers3,
  Shield,
  Workflow,
} from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const readinessCards = [
  {
    title: 'Monorepo',
    description: 'Frontend, backend y archivos raíz del proyecto.',
    icon: Layers3,
  },
  {
    title: 'Autenticación',
    description: 'JWT, login y bootstrap de sesión desde /auth/me.',
    icon: Shield,
  },
  {
    title: 'Base de datos',
    description: 'Flyway listo con roles y usuario administrador seed.',
    icon: Database,
  },
]

export function DashboardPage() {
  const { session } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="border-none bg-[linear-gradient(135deg,_rgba(17,24,39,1)_0%,_rgba(30,41,59,1)_45%,_rgba(37,99,235,0.95)_100%)] text-white shadow-xl">
          <CardHeader className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit bg-white/12 text-white">
              Sprint 0 implementado
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight text-balance">
              Bienvenido, {session?.user.name}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-7 text-slate-200">
              La plataforma ya cuenta con autenticación funcional, shell
              protegido, migraciones iniciales y seed del usuario administrador.
              El siguiente sprint puede concentrarse en módulos de negocio sin
              rehacer infraestructura.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {readinessCards.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
              >
                <item.icon className="size-5 text-white/85" />
                <p className="mt-4 text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-sm text-slate-200">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sesión actual</CardTitle>
            <CardDescription>
              Datos cargados desde el backend autenticado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Correo</span>
              <span className="text-sm font-medium">{session?.user.email}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant="outline">{session?.user.status}</Badge>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Roles</span>
              <div className="flex flex-wrap gap-2">
                {session?.user.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Checklist técnico</CardTitle>
            <CardDescription>
              Lo que ya quedó resuelto para los próximos sprints.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              'API REST con prefijo /api/v1',
              'JWT stateless con SecurityFilterChain',
              'Seed de roles y admin configurable por variables de entorno',
              'Rutas protegidas y shell por rol en React',
              'Base Docker Compose para levantar todo el entorno',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próxima capa del producto</CardTitle>
            <CardDescription>
              Módulos que ya pueden apoyarse en esta fundación.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <Workflow className="size-5 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">Sprint 1 recomendado</p>
                  <p className="text-sm text-muted-foreground">
                    Usuarios, roles, empleados, áreas, cargos y sedes.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              La navegación ya anticipa los módulos futuros para que podamos
              conectarlos gradualmente sin rehacer el layout.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
