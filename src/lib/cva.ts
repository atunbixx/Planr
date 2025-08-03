import { clsx, type ClassValue } from 'clsx';

export type VariantProps<T extends (...args: any) => any> = T extends (...args: any) => any
  ? {
      [K in keyof Parameters<T>[0]]?: Parameters<T>[0][K] extends Record<string, any>
        ? keyof Parameters<T>[0][K]
        : never;
    }
  : never;

interface Config<T = Record<string, Record<string, string>>> {
  variants?: T;
  defaultVariants?: { [K in keyof T]?: keyof T[K] };
}

export function cva<T extends Record<string, Record<string, string>>>(
  base: ClassValue,
  config?: Config<T>
) {
  return (props?: { [K in keyof T]?: keyof T[K] } & { className?: ClassValue }) => {
    if (!config) return clsx(base, props?.className);

    const { variants = {}, defaultVariants = {} } = config;
    const variantClasses: ClassValue[] = [];

    Object.keys(variants).forEach((variantKey) => {
      const variantProp = props?.[variantKey as keyof typeof props];
      const defaultVariantProp = defaultVariants[variantKey as keyof typeof defaultVariants];
      const variantValue = variantProp ?? defaultVariantProp;

      if (variantValue && variants[variantKey]?.[variantValue as string]) {
        variantClasses.push(variants[variantKey][variantValue as string]);
      }
    });

    return clsx(base, ...variantClasses, props?.className);
  };
}