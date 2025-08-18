type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, any>

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input))
    } else if (Array.isArray(input)) {
      const nested = clsx(...input)
      if (nested) classes.push(nested)
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }

  return classes.join(" ")
}

// Simple tailwind-merge replacement - just removes duplicates
function twMerge(classNames: string): string {
  return classNames
    .split(" ")
    .filter((cls, index, arr) => cls && arr.lastIndexOf(cls) === index)
    .join(" ")
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
