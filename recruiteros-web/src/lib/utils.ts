import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a LinkedIn profile URL by:
 * 1. Stripping query parameters
 * 2. Stripping trailing slashes
 * 3. Standardizing to https://www.linkedin.com/in/username format
 */
export function normalizeLinkedInUrl(urlStr: string): string | null {
  try {
    const trimmed = urlStr.trim();
    if (!trimmed) return null;

    // Match linkedin.com/in/username
    const regex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i;
    const match = trimmed.match(regex);
    if (!match) return null;

    const username = match[1].toLowerCase();
    return `https://www.linkedin.com/in/${username}`;
  } catch (error) {
    return null;
  }
}
