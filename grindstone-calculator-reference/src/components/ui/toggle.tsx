import * as React from 'react'
import { cn } from './utils'
interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}
export function Toggle({ className, pressed=false, onPressedChange, ...props }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange && onPressedChange(!pressed)}
      className={cn('inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm',
        pressed ? 'bg-slate-900 text-white' : 'bg-white text-slate-900',
        className
      )}
      {...props}
    />
  )
}
