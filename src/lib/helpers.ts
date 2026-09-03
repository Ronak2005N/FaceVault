import { POLYGON_AMOY } from "./blockchain/contracts";

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isHashLike(value: string) {
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

export function shorten(value: string, lead = 6, tail = 4) {
  if (!value) return "";
  if (value.length <= lead + tail + 3) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

export function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${formatDate(value)} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC`;
}

export function explorerTx(tx: string) {
  return `${POLYGON_AMOY.explorerUrl}/tx/${tx}`;
}

export function explorerAddress(address: string) {
  return `${POLYGON_AMOY.explorerUrl}/address/${address}`;
}
