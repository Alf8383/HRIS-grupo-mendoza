import { useState, type FormEvent } from 'react'
import { LogIn, ShieldCheck, Users, CalendarClock, FileText } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/auth-context'
import { ApiClientError } from '@/lib/http'
import { appEnv } from '@/lib/env'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LocationState = {
  from?: {
    pathname?: string
  }
}

const highlights = [
  {
    icon: Users,
    title: 'Gestión de personal',
    description: 'Administra empleados, áreas y cargos.',
  },
  {
    icon: CalendarClock,
    title: 'Control de asistencia',
    description: 'Registra y consulta la jornada laboral.',
  },
  {
    icon: FileText,
    title: 'Permisos y licencias',
    description: 'Solicita y aprueba ausencias del equipo.',
  },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fromPath =
    ((location.state as LocationState | null)?.from?.pathname as string | undefined) ??
    '/app/dashboard'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await login(email, password)
      toast.success('Sesión iniciada correctamente.')
      navigate(fromPath, { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'No pudimos iniciar sesión.'

      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-muted/30 px-4 py-8">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.06) 0%, transparent 50%)',
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(248,250,252,0.8)_100%)]" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="hidden flex-col gap-8 lg:flex">
          <div className="flex max-w-xl flex-col gap-5">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ShieldCheck className="size-7" />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Grupo Mendoza
              </p>
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-balance text-foreground">
                Gestiona Recursos Humanos desde un solo lugar
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Accede a tu panel para consultar información, revisar tu cuenta
                y trabajar con los módulos habilitados según tu perfil.
              </p>
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border bg-white/60 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:bg-white/80 hover:shadow-md"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                  <item.icon className="size-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Card className="relative border-white/60 bg-white/80 shadow-2xl shadow-slate-200/40 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <LogIn className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Ingresar al sistema</CardTitle>
                <CardDescription>{appEnv.appName}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@empresa.com"
                  autoComplete="email"
                  className="transition-shadow duration-200 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  className="transition-shadow duration-200 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full transition-all duration-200 ease-out active:scale-[0.98]"
              >
                <LogIn data-icon="inline-start" />
                {submitting ? 'Ingresando...' : 'Iniciar sesión'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">
              Usa tus credenciales para acceder al sistema.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
