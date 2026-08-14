import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
 *
 * createBrowserClient 는 내부적으로 같은 인스턴스를 재사용하므로
 * 컴포넌트마다 호출해도 커넥션이 늘어나지 않는다.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
