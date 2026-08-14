import { parseSettings, type Settings } from "./types";

const KEY = "injection-journal:settings:v1";

/**
 * 설정을 브라우저에도 둔다.
 *
 * Supabase 가 정답이지만 네트워크 왕복이 필요해서, 앱을 열 때마다 설정 화면이
 * 한 번 번쩍인 뒤 홈으로 넘어가는 현상이 생긴다. 로컬 사본이 있으면 그 깜빡임이
 * 사라지고, 지하철처럼 신호가 끊기는 곳에서도 화면이 뜬다.
 */
export function readLocalSettings(): Settings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return parseSettings(JSON.parse(raw));
  } catch {
    // 사파리 프라이빗 모드에서는 localStorage 접근 자체가 던진다.
    return null;
  }
}

export function writeLocalSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // 저장을 못 해도 Supabase 에는 들어가므로 앱은 계속 쓸 수 있다.
  }
}

export function clearLocalSettings(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}
