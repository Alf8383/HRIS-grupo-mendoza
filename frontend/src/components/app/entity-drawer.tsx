import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface EntityDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
}

export function EntityDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: EntityDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          'flex flex-col overflow-hidden px-0 data-[vaul-drawer-direction=bottom]:max-h-[92vh]',
          sizeClasses[size],
        )}
      >
        <DrawerHeader className="shrink-0 px-6 pb-2 text-left">
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description && <DrawerDescription className="text-sm">{description}</DrawerDescription>}
        </DrawerHeader>
        <ScrollArea className="min-h-0 flex-1 px-6">
          <div className="pb-5 pt-2">{children}</div>
        </ScrollArea>
        {footer && (
          <DrawerFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border/60 bg-background px-6 py-4">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export function EntityDrawerActions({
  onCancel,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  isLoading,
  form,
}: {
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  form?: string
}) {
  return (
    <>
      <DrawerClose asChild>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
      </DrawerClose>
      <Button type="submit" disabled={isLoading} form={form}>
        {isLoading ? 'Guardando...' : submitLabel}
      </Button>
    </>
  )
}
