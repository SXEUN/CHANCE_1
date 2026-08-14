/**
 * 날짜는 전부 "로컬 달력의 하루"로 다룬다.
 *
 * toISOString() 은 UTC 로 바꿔버려서 한국(UTC+9)에서 오전 9시 이전에 쓰면
 * 하루 전 날짜가 나온다. 주사 일지에서 이건 치명적이므로 직접 만든다.
 */
export function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function daysBetween(startKey: string, endKey: string): number {
  const start = fromKey(startKey);
  const end = fromKey(endKey);
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / 86_400_000) + 1; // 시작일과 종료일을 모두 포함
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 달력 한 판에 그릴 42칸(6주)을 만든다.
 * 칸 수를 6주로 고정해야 달을 넘길 때 달력 높이가 출렁이지 않는다.
 */
export function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(1 - first.getDay()); // 그 주의 일요일로 되감기

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function formatKorean(key: string): string {
  const d = fromKey(key);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
