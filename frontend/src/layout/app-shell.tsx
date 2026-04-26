import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { appEnv } from '@/lib/env'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type NavItem = {
  label: string
  description: string
  to: string
  roles: string[]
  icon: typeof Users
  isPlaceholder?: boolean
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    description: 'Estado general del Sprint 0',
    to: '/app/dashboard',
    roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
    icon: BadgeCheck,
  },
  {
    label: 'Usuarios',
    description: 'Gestión administrativa',
    to: '/app/users',
    roles: ['ADMIN'],
    icon: ShieldCheck,
    isPlaceholder: true,
  },
  {
    label: 'Empleados',
    description: 'Base maestra del personal',
    to: '/app/employees',
    roles: ['ADMIN', 'HR'],
    icon: Users,
    isPlaceholder: true,
  },
  {
    label: 'Asistencia',
    description: 'Control diario y reportes',
    to: '/app/attendance',
    roles: ['ADMIN', 'HR', 'MANAGER'],
    icon: ClipboardList,
    isPlaceholder: true,
  },
  {
    label: 'Vacaciones',
    description: 'Solicitudes y saldos',
    to: '/app/vacations',
    roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    icon: CalendarClock,
    isPlaceholder: true,
  },
  {
    label: 'Contratos',
    description: 'Vigencia y renovaciones',
    to: '/app/contracts',
    roles: ['ADMIN', 'HR'],
    icon: BriefcaseBusiness,
    isPlaceholder: true,
  },
]

function SidebarNav({
  items,
  onNavigate,
}: {
  items: NavItem[]
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Navegación
        </p>
        <p className="text-sm text-muted-foreground">
          Accesos visibles según tu rol activo.
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group rounded-xl border border-transparent px-3 py-3 transition-colors',
                item.isPlaceholder && 'opacity-80',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:border-border hover:bg-accent',
              )
            }
          >
            {({ isActive }) => (
              <div className="flex items-start gap-3">
                <item.icon
                  className={cn(
                    'mt-0.5 size-4',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground',
                  )}
                />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.isPlaceholder ? (
                      <Badge variant={isActive ? 'secondary' : 'outline'}>
                        Próximamente
                      </Badge>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'text-xs',
                      isActive
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground',
                    )}
                  >
                    {item.description}
                  </span>
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function AppShell() {
  const { session, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const user = session?.user
  const visibleItems = navItems.filter((item) =>
    item.roles.some((role) => user?.roles.includes(role)),
  )
  const primaryRole = user?.roles[0] ?? 'USER'

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-sidebar-border bg-sidebar lg:block">
          <div className="flex h-full flex-col gap-6 px-5 py-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{appEnv.appName}</p>
                  <p className="text-xs text-muted-foreground">
                    Plataforma base Sprint 0
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                Rol actual: {primaryRole}
              </Badge>
            </div>

            <Separator />
            <SidebarNav items={visibleItems} />
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
              <div className="flex items-center gap-3">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu />
                      <span className="sr-only">Abrir navegación</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] px-0">
                    <SheetHeader className="px-5 pb-2">
                      <SheetTitle>{appEnv.appName}</SheetTitle>
                    </SheetHeader>
                    <div className="px-5 py-4">
                      <SidebarNav
                        items={visibleItems}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    Panel base del sistema
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Autenticación lista y shell protegido por roles
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto rounded-full px-2 py-1.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border">
                        <AvatarFallback>
                          {user?.name
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden flex-col items-start gap-0.5 text-left sm:flex">
                        <span className="text-sm font-medium leading-none">
                          {user?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Sesión activa</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <div className="flex flex-col gap-2 px-2 py-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{primaryRole}</Badge>
                        <Badge variant="outline">{user?.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        El endpoint <code>/auth/me</code> ya está conectado a esta
                        sesión.
                      </p>
                    </div>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer"
                    >
                      <LogOut data-icon="inline-start" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
