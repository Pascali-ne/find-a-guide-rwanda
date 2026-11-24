export const LOCATIONS = ["Kigali", "Volcanoes National Park", "Nyungwe National Park", "Lake Kivu", "Akagera National Park"];
export const DESTINATIONS = [...LOCATIONS, "Other destination in Rwanda"];
export const LANGUAGES = ["English", "French", "Kinyarwanda", "Swahili", "German", "Spanish", "Chinese", "Arabic"];

export const EMERGENCY_CONTACTS = [
  { name: "Rwanda National Police", detail: "Emergency line", value: "112", tel: "112" },
  { name: "Traffic Police", detail: "Road accidents", value: "113", tel: "113" },
  { name: "Ambulance (SAMU)", detail: "Medical emergencies", value: "912", tel: "912" },
  { name: "Fire and Rescue", detail: "Fire emergencies", value: "111", tel: "111" },
  { name: "Rwanda Investigation Bureau", detail: "Report a crime or scam", value: "166", tel: "166" },
];

export const formatRwf = (n: number) => `${n.toLocaleString("en-US")} RWF`;
export const formatUsd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function formatDate(date: string): string {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export const todayStr = () => new Date().toISOString().slice(0, 10);
