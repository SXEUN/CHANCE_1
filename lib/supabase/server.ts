import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * 서버 컴포넌트 / 서버 액션 / 라우트 핸들러에서 쓰는 Supabase 클라이언트.
 *
 * Next 16 에서 cookies() 는 비동기라 await 가 필요하다.
 * 요청마다 새로 만들어야 하므로 모듈 최상단에 캐싱하면 안 된다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없어 여기로 떨어진다.
          // 세션 갱신은 proxy.ts 가 담당하므로 무시해도 안전하다.
        }
      },
    },
  });
}
