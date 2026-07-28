import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Bỏ dấu tiếng Việt + chữ thường, để so khớp tìm kiếm KHÔNG phân biệt dấu. */
export function boDauTiengViet(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
}
