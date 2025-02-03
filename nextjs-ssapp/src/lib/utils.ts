import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function buildReference(id: string) {
  return {
    _type: "reference",
    _ref: id,
  };
}
