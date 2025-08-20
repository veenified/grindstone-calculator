import * as React from 'react'
import { cn } from './utils'
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary'
}
export function Button({ className, variant='default', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium shadow-sm transition-colors'
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-white text-slate-900 border hover:bg-slate-50',
  } as const
  return <button className={cn(base, variants[variant], className)} {...props} />
}
