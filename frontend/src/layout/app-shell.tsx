import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  CalendarClock,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileBadge2,
  FileSpreadsheet,
  History,
  LogOut,
  Menu,
  Network,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { PageTransition } from '@/components/app/page-transition'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type NavItem = {
  label: string
  to: string
  roles: string[]
  icon: typeof Users
  description: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      {
        label: 'Dashboard',
        description: 'Resumen general',
        to: '/app/dashboard',
        roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
        icon: BadgeCheck,
      },
    ],
  },
  {
    label: 'Personas',
    items: [
      {
        label: 'Empleados',
        description: 'Base maestra del personal',
        to: '/app/employees',
        roles: ['ADMIN', 'HR'],
        icon: Users,
      },
      {
        label: 'Usuarios',
        description: 'Gestión administrativa',
        to: '/app/users',
        roles: ['ADMIN'],
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: 'Operaciones',
    items: [
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
        label: 'Vacaciones',
        description: 'Saldo, solicitudes y aprobaciones',
        to: '/app/vacations',
        roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
        icon: CalendarDays,
      },
      {
        label: 'Contratos',
        description: 'Vigencia y renovaciones',
        to: '/app/contracts',
        roles: ['ADMIN', 'HR'],
        icon: FileBadge2,
      },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      {
        label: 'Reportes',
        description: 'Consulta y exportación',
        to: '/app/reports',
        roles: ['ADMIN', 'HR', 'MANAGER'],
        icon: FileSpreadsheet,
      },
      {
        label: 'Bitácora',
        description: 'Trazabilidad operativa',
        to: '/app/audit',
        roles: ['ADMIN', 'HR'],
        icon: History,
      },
    ],
  },
  {
    label: 'Configuración',
    items: [
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
    ],
  },
]

function SidebarNavItem({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -left-0.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon className={cn('size-4', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAuth()
  const user = session?.user
  const location = useLocation()

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.some((role) => user?.roles.includes(role))),
    }))
    .filter((group) => group.items.length > 0)

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    visibleGroups.forEach((group) => {
      initial[group.label] = group.items.some((item) => location.pathname.startsWith(item.to))
    })
    return initial
  })

  const toggleGroup = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {visibleGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <button
            onClick={() => toggleGroup(group.label)}
            className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {group.label}
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform duration-200',
                expanded[group.label] ? 'rotate-180' : '',
              )}
            />
          </button>
          {expanded[group.label] && (
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.label} item={item} onNavigate={onNavigate} />
              ))}
            </nav>
          )}
        </div>
      ))}
    </div>
  )
}

export function AppShell() {
  const { session, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const user = session?.user
  const primaryRole = user?.roles[0] ?? 'USER'

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border/60 bg-sidebar lg:block">
          <div className="flex h-full flex-col px-4 py-5">
            <div className="flex items-center gap-3 px-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold leading-tight text-foreground">{appEnv.appName}</p>
                <p className="text-[11px] text-muted-foreground">Recursos Humanos</p>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="flex-1 overflow-y-auto pr-1">
              <SidebarNav />
            </div>

            <div className="mt-auto pt-4">
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs font-medium text-foreground">{user?.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {getRoleLabel(primaryRole)}
                </Badge>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
              <div className="flex items-center gap-3">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu />
                      <span className="sr-only">Abrir navegación</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] px-0">
                    <SheetHeader className="px-5 pb-2">
                      <SheetTitle>{appEnv.appName}</SheetTitle>
                    </SheetHeader>
                    <div className="px-4 py-4">
                      <SidebarNav onNavigate={() => setMobileOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="hidden h-8 w-px bg-border/60 lg:block" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto gap-2 rounded-lg px-2 py-1.5">
                    <Avatar className="size-8 border border-border/60">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {user?.name
                          ?.split(' ')
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col items-start text-left sm:flex">
                      <span className="text-sm font-medium leading-none">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-xs">
                    Rol: {getRoleLabel(primaryRole)}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </div>
  )
}
