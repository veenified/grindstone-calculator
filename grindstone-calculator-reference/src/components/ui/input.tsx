import * as React from 'react'
import { cn } from './utils'
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-9 w-full rounded-md border px-2 text-sm', className)} {...props} />
}
