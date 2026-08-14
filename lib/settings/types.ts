import { isInjectionName, type InjectionName } from "@/lib/injections";

export type Settings = {
  injectionName: InjectionName;
  /** 0-23. 화면에서는 오전/오후 + 1~12시로 보여주지만 저장은 24시간제로 한다. */
  scheduledHour: number;
  /** 0-59. 5분 단위로만 고른다. */
  scheduledMinute: number;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * localStorage 나 DB 에서 읽은 값은 신뢰할 수 없다.
 * 앱 버전이 올라가며 모양이 바뀌었을 수도, 사용자가 직접 건드렸을 수도 있다.
 * 어긋나면 null 을 돌려주고 설정 화면을 다시 띄우는 쪽이 안전하다.
 */
export function parseSettings(value: unknown): Settings | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;

  if (!isInjectionName(v.injectionName)) return null;

  const hour = Number(v.scheduledHour);
  const minute = Number(v.scheduledMinute);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;

  const { startDate, endDate } = v;
  if (typeof startDate !== "string" || !DATE_RE.test(startDate)) return null;
  if (typeof endDate !== "string" || !DATE_RE.test(endDate)) return null;
  if (endDate < startDate) return null;

  return {
    injectionName: v.injectionName,
    scheduledHour: hour,
    scheduledMinute: minute,
    startDate,
    endDate,
  };
}

/** 24시간제 → 화면에 쓰는 오전/오후 + 1~12시 */
export function toMeridiem(hour24: number): {
  meridiem: "AM" | "PM";
  hour12: number;
} {
  const meridiem = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { meridiem, hour12 };
}

/** 오전/오후 + 1~12시 → 24시간제 */
export function toHour24(meridiem: "AM" | "PM", hour12: number): number {
  const base = hour12 % 12; // 12시는 0으로 접는다
  return meridiem === "AM" ? base : base + 12;
}

export function formatTime(hour24: number, minute: number): string {
  const { meridiem, hour12 } = toMeridiem(hour24);
  const label = meridiem === "AM" ? "오전" : "오후";
  return `${label} ${hour12}시 ${String(minute).padStart(2, "0")}분`;
}
