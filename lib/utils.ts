import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date_ms: number) {
  const date_obj = new Date(date_ms);

  const current_date = new Date();
  current_date.setHours(0, 0, 0, 0);

  const provided_date = new Date(date_obj);
  provided_date.setHours(0, 0, 0, 0);

  // Today
  if (provided_date.getTime() === current_date.getTime()) {
    return date_obj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  if (provided_date.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  // Same week → return weekday name
  if (provided_date > new Date(current_date.getTime() - 6 * 86400000)) {
    return provided_date.toLocaleDateString(undefined, { weekday: "long" });
  }

  // Else → return full date
  return provided_date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const isSameDay = (timestamp1: number, timestamp2: number): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Returns "Today", "Yesterday", weekday, or formatted date
 * for a single message timestamp.
 */
export const getRelativeDate = (timestamp: number, p0: number | undefined): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(timestamp);

  if (isSameDay(messageDate.getTime(), today.getTime())) {
    return "Today";
  }
  if (isSameDay(messageDate.getTime(), yesterday.getTime())) {
    return "Yesterday";
  }
  if (messageDate > new Date(today.getTime() - 6 * 86400000)) {
    return messageDate.toLocaleDateString(undefined, { weekday: "long" });
  }
  return messageDate.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function randomID(len: number) {
  let result = "";
  if (result) return result;
  const chars =
    "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP";
  const maxPos = chars.length;
  len = len || 5;
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}
