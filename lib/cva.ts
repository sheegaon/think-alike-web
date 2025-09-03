// Simple replacement for class-variance-authority to fix loading issues in v0
import { cn } from "./utils"

type VariantsConfig = Record<string, Record<string, string>>;

type CvaConfig<T extends VariantsConfig> = {
  variants?: T,
  defaultVariants?: { [K in keyof T]?: keyof T[K] }
}

type CvaProps<T extends VariantsConfig> = {
  [K in keyof T]?: keyof T[K] | null
}

export function cva<T extends VariantsConfig>(
  base: string,
  config?: CvaConfig<T>
) {
  return (props: CvaProps<T> & { className?: string, [key: string]: any }) => {
    let resultClasses = base;
    if (config?.variants) {
        for (const variantName of Object.keys(config.variants)) {
            const variantPropValue = props[variantName];
            const defaultVariantValue = config.defaultVariants?.[variantName];
            
            const value = variantPropValue ?? defaultVariantValue;
            
            if (value) {
                const classForVariant = config.variants[variantName][value as string];
                if (classForVariant) {
                    resultClasses = `${resultClasses} ${classForVariant}`;
                }
            }
        }
    }
    
    return cn(resultClasses, props.className);
  }
}

export type VariantProps<T extends (...args: any) => any> = Omit<Parameters<T>[0], 'className'>;
