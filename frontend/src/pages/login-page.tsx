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
    description: 'Administra empleados, áreas y cargos en un solo lugar.',
  },
  {
    icon: CalendarClock,
    title: 'Control de asistencia',
    description: 'Registra y consulta la jornada laboral diaria.',
  },
  {
    icon: FileText,
    title: 'Permisos y licencias',
    description: 'Solicita y aprueba ausencias de forma sencilla.',
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
        error instanceof ApiClientError ? error.message : 'No pudimos iniciar sesión.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[#fafaf9] px-4 py-8">
      {/* Warm abstract background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 25%, rgba(180,83,9,0.06) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(217,119,6,0.05) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(251,191,36,0.04) 0%, transparent 60%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.03]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(250,250,249,0.9)_100%)]" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="hidden flex-col gap-10 lg:flex">
          <div className="flex max-w-xl flex-col gap-5">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
              <ShieldCheck className="size-7" />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Grupo Mendoza
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
                Gestión de Recursos Humanos simplificada
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Accede a tu panel para consultar información, revisar tu cuenta y trabajar con los módulos habilitados según tu perfil.
              </p>
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-card hover:shadow-md"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                  <item.icon className="size-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Card className="relative border border-border/60 bg-card/95 shadow-xl shadow-stone-200/40 backdrop-blur-sm">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <LogIn className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <CardTitle className="text-lg">Ingresar al sistema</CardTitle>
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
                  className="h-10 rounded-lg border-border/60 transition-shadow duration-200 focus-visible:ring-primary/30"
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
                  className="h-10 rounded-lg border-border/60 transition-shadow duration-200 focus-visible:ring-primary/30"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-10 w-full transition-all duration-200 ease-out active:scale-[0.98]"
              >
                <LogIn className="mr-2 size-4" />
                {submitting ? 'Ingresando...' : 'Iniciar sesión'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-2 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              Usa tus credenciales corporativas para acceder al sistema.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
