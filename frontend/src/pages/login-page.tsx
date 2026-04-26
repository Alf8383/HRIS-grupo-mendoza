import { useState, type FormEvent } from 'react'
import { LogIn, ShieldCheck } from 'lucide-react'
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

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('admin@grupomendoza.com')
  const [password, setPassword] = useState('Admin12345!')
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
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,1)_100%)] px-4 py-8">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="hidden flex-col gap-6 lg:flex">
          <div className="flex max-w-xl flex-col gap-5">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ShieldCheck className="size-7" />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Sprint 0
              </p>
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-balance text-foreground">
                Base técnica lista para el sistema de RR. HH.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Esta primera entrega ya deja corriendo el monorepo, la base de
                datos, el seed del usuario administrador y la autenticación JWT
                conectada al frontend.
              </p>
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-4">
            {[
              'React + TypeScript',
              'Spring Boot + JWT',
              'PostgreSQL + Flyway',
            ].map((item) => (
              <Card key={item} className="border-white/60 bg-white/80 shadow-sm">
                <CardContent className="flex min-h-28 items-end p-5">
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="border-white/70 bg-white/88 shadow-2xl shadow-slate-200/70 backdrop-blur">
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
                  placeholder="admin@grupomendoza.com"
                  autoComplete="email"
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
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                <LogIn data-icon="inline-start" />
                {submitting ? 'Ingresando...' : 'Iniciar sesión'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">
              Credenciales seed para entorno local: <strong>admin@grupomendoza.com</strong> /{' '}
              <strong>Admin12345!</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Estas credenciales se pueden cambiar con variables de entorno del
              backend.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
