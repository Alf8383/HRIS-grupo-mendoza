import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  CalendarClock,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  LogOut,
  Menu,
  Network,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { StatusBadge } from '@/components/app/status-badge'
import { useAuth } from '@/contexts/auth-context'
import { appEnv } from '@/lib/env'
import { getRoleLabel } from '@/lib/roles'
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
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    description: 'Resumen general',
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
  },
  {
    label: 'Asistencia',
    description: 'Control diario y seguimiento',
    to: '/app/attendance',
    roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
    icon: CalendarClock,
  },
  {
    label: 'Permisos',
    description: 'Solicitudes y aprobaciones',
    to: '/app/leave-requests',
    roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
    icon: ClipboardList,
  },
  {
    label: 'Empleados',
    description: 'Base maestra del personal',
    to: '/app/employees',
    roles: ['ADMIN', 'HR'],
    icon: Users,
  },
  {
    label: 'Áreas',
    description: 'Estructura organizacional',
    to: '/app/settings/areas',
    roles: ['ADMIN', 'HR'],
    icon: Building2,
  },
  {
    label: 'Cargos',
    description: 'Asignación por área',
    to: '/app/settings/cargos',
    roles: ['ADMIN', 'HR'],
    icon: BriefcaseBusiness,
  },
  {
    label: 'Sedes',
    description: 'Ubicación operativa',
    to: '/app/settings/sedes',
    roles: ['ADMIN', 'HR'],
    icon: Network,
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
          Módulos
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
                  <p className="text-xs text-muted-foreground">Recursos Humanos</p>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                Rol actual: {getRoleLabel(primaryRole)}
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
                    Panel principal
                  </p>
                  <p className="text-xs text-muted-foreground">Gestión de Recursos Humanos</p>
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
                      {user?.status ? <StatusBadge value={user.status} /> : null}
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
