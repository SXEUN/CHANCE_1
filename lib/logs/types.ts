/**
 * 주사 부위.
 *
 * 화면은 "거울 방향"으로 그린다 — 사용자가 거울을 보듯, 사용자의 오른쪽
 * 복부가 화면에서도 오른쪽에 온다. 그래서 RIGHT 는 언제나 사용자 몸의
 * 오른쪽이며, 해부학적 정면도(보는 사람 기준 좌우가 뒤집히는)와 다르다.
 */
export type InjectionSite = "LEFT" | "RIGHT" | "LOWER";

export type InjectionLog = {
  /** YYYY-MM-DD */
  date: string;
  site: InjectionSite;
};

export const SITE_LABEL: Record<InjectionSite, string> = {
  RIGHT: "우측 복부",
  LEFT: "좌측 복부",
  LOWER: "하복부",
};

export const SITE_SHORT: Record<InjectionSite, string> = {
  RIGHT: "R",
  LEFT: "L",
  LOWER: "U",
};

/**
 * 오늘 추천할 부위를 고른다.
 *
 * 같은 자리에 반복해서 놓으면 멍과 경결(硬結)이 생기므로 매일 좌우를
 * 번갈아 쓴다. 직전 기록의 반대쪽을 추천하고, 기록이 없으면 오른쪽부터.
 *
 * 기준이 되는 "직전 기록"은 선택한 날짜보다 앞선 것 중 가장 최근 것이다.
 * 사용자가 지난 날짜를 뒤늦게 채워 넣어도 그 날 시점의 순서가 유지된다.
 */
export function recommendSite(
  logs: InjectionLog[],
  forDate: string,
): Exclude<InjectionSite, "LOWER"> {
  const previous = logs
    .filter((l) => l.date < forDate && l.site !== "LOWER")
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  if (!previous) return "RIGHT";
  return previous.site === "RIGHT" ? "LEFT" : "RIGHT";
}
