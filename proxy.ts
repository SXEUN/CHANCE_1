import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Next 16 에서 middleware 규약이 proxy 로 이름이 바뀌었다.
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md)
 *
 * 하는 일은 하나 — 매 요청마다 Supabase 세션 토큰을 갱신하고
 * 갱신된 쿠키를 응답에 다시 실어준다. 이게 없으면 토큰이 만료된 뒤
 * 서버 컴포넌트에서 로그인이 풀린 것처럼 보인다.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() 를 호출해야 실제로 토큰 갱신이 일어난다. 결과는 여기서 쓰지 않는다.
  // getSession() 이 아니라 getUser() 여야 한다 — 전자는 쿠키를 검증 없이 믿는다.
  await supabase.auth.getUser();

  // 반드시 이 response 를 그대로 돌려줘야 한다. 새로 만들면 갱신된 쿠키가 날아간다.
  return response;
}

export const config = {
  // 정적 파일까지 프록시를 태우면 CSS/이미지 로딩이 느려지고 무의미하다.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
