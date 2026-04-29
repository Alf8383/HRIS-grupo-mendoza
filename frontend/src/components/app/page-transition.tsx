import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div
      key={location.pathname}
      className="animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out fill-mode-backwards"
    >
      {children}
    </div>
  )
}
