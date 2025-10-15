// src/lib/whatsapp.ts
import { CartItem, CartSnapshot } from "@/types/cart";

/**
 * Compose a Spanish message for WhatsApp including all items in the cart.
 * Keep this function pure and UI-agnostic.
 */
export function composeCartMessage(
  snapshot: CartSnapshot,
  options?: {
    header?: string; // Spanish text shown at the top
    footerNote?: string; // Spanish note at the bottom (e.g., preferred time, location)
    includePrices?: boolean; // Only used if items have price+currency
  }
): string {
  const header = (options?.header ?? "Hola, me interesan estos productos:").trim();
  const footer = options?.footerNote?.trim();
  const bullet = "•";

  const lines: string[] = [];
  lines.push(header, "");

  snapshot.items.forEach((item, idx) => {
    lines.push(formatLineItem(item, bullet, options?.includePrices));
    // Add a small separator between items if descriptions are long (optional):
    if (idx < snapshot.items.length - 1) {
      // lines.push(""); // Uncomment if you want extra spacing
    }
  });

  if (footer) {
    lines.push("", footer);
  }

  return lines.join("\n");
}

/**
 * Convert a phone number to a wa.me deep-link.
 * - `phone` accepts any format; only digits are kept (E.164 recommended).
 * - If no phone is provided, the generic share URL is returned.
 */
export function buildWaLink(phone: string | undefined | null, text: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const encoded = encodeURIComponent(text);
  return digits.length > 0 ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * Optional helper to keep messages under a certain length (WhatsApp is generous but not infinite).
 */
export function truncateForWhatsApp(text: string, max = 3500): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3))}...`;
}

/**
 * Internal: build one line for a cart item in Spanish.
 */
function formatLineItem(item: CartItem, bullet: string, includePrices?: boolean): string {
  const qtyPart = `x${item.qty}`;
  const pricePart =
    includePrices && item.price != null && item.currency
      ? ` — ${formatPrice(item.price, item.currency)}`
      : "";

  return `${bullet} ${item.name} (${qtyPart})${pricePart}`;
}

/**
 * Internal: basic currency formatting. Relies on Intl.NumberFormat.
 * If currency code is unrecognized, falls back to a plain number.
 */
function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
