/**
 * 환경변수를 한 곳에서 읽고 검증한다.
 *
 * Vercel 에 환경변수를 넣는 걸 깜빡하면 브라우저에서는 "Invalid URL" 같은
 * 엉뚱한 에러로 터진다. 여기서 미리 걸러서 원인이 바로 보이게 한다.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `환경변수 ${name} 가 없습니다. 로컬은 .env.local, 배포본은 Vercel 프로젝트 설정의 Environment Variables 를 확인하세요.`,
    );
  }
  return value;
}

// NEXT_PUBLIC_ 접두사가 붙은 값은 빌드 시점에 번들로 치환되므로
// process.env[name] 처럼 동적으로 접근하면 안 되고 반드시 통째로 써야 한다.
export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
