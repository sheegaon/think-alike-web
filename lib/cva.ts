// Simple replacement for class-variance-authority to fix loading issues in v0
import { cn } from "./utils"

type VariantConfig = {
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
}

type VariantProps<T> = T extends (...args: any[]) => any
  ? {
      [K in keyof Parameters<T>[0]]?: Parameters<T>[0][K] extends Record<string, any>
        ? keyof Parameters<T>[0][K]
        : Parameters<T>[0][K]
    }
  : never

export function cva(base: string, config?: VariantConfig) {
  return (props: Record<string, any> = {}) => {
    const { className, ...variants } = props

    let classes = base

    if (config?.variants) {
      Object.entries(variants).forEach(([key, value]) => {
        if (value && config.variants?.[key]?.[value]) {
          classes += ` ${config.variants[key][value]}`
        }
      })

      // Apply default variants for missing props
      if (config.defaultVariants) {
        Object.entries(config.defaultVariants).forEach(([key, defaultValue]) => {
          if (variants[key] === undefined && config.variants?.[key]?.[defaultValue]) {
            classes += ` ${config.variants[key][defaultValue]}`
          }
        })
      }
    }

    return cn(classes, className)
  }
}

export type { VariantProps }
