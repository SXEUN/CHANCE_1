import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// 이 라우트는 매 요청마다 실제로 Supabase 에 붙어봐야 의미가 있으므로
// 프리렌더/캐시를 끈다.
export const dynamic = "force-dynamic";

/**
 * 배포본이 Supabase 에 실제로 도달하는지 확인하는 점검용 엔드포인트.
 *
 * 환경변수 누락은 빌드가 아니라 런타임에 터지기 때문에, 배포가 "성공"으로
 * 뜬 뒤에도 사이트가 죽어 있을 수 있다. 그 상태를 배포 직후 1초 만에
 * 잡아내려고 둔다. 비밀값은 노출하지 않고 존재 여부와 접두사만 돌려준다.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    supabaseUrl: SUPABASE_URL,
    anonKeyPrefix: SUPABASE_ANON_KEY.slice(0, 18) + "…",
    anonKeyLength: SUPABASE_ANON_KEY.length,
  };

  try {
    const supabase = await createClient();
    // 세션이 없으면 user 는 null 이고 error 도 없다. 둘 다 정상 응답이다.
    // 여기서 확인하려는 건 "Supabase 에 요청이 오갔는가" 하나다.
    const { error } = await supabase.auth.getUser();

    checks.reachedSupabase = true;
    checks.authError = error ? error.message : null;
  } catch (e) {
    checks.reachedSupabase = false;
    checks.error = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, checks }, { status: 500 });
  }

  return Response.json({ ok: true, checks });
}
