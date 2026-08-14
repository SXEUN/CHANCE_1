import { createClient } from "@/lib/supabase/client";

import { parseSettings, type Settings } from "./types";

/**
 * 익명 세션을 보장한다.
 *
 * 회원가입 없이 쓰는 앱이지만 "누구의 기록인지"는 구분해야 한다.
 * 익명 로그인으로 발급된 uid 가 RLS 의 기준이 되고, 그 세션은 브라우저
 * 쿠키에 남아 다음 방문에도 같은 사람으로 이어진다.
 */
export async function ensureSession(): Promise<string> {
  const supabase = createClient();

  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;

  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signedIn.user) {
    throw new Error(error?.message ?? "익명 세션을 만들지 못했습니다.");
  }
  return signedIn.user.id;
}

export async function fetchSettings(): Promise<Settings | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "injection_name, scheduled_hour, scheduled_minute, start_date, end_date",
    )
    .maybeSingle();

  if (error || !data) return null;

  return parseSettings({
    injectionName: data.injection_name,
    scheduledHour: data.scheduled_hour,
    scheduledMinute: data.scheduled_minute,
    startDate: data.start_date,
    endDate: data.end_date,
  });
}

export async function saveSettings(
  userId: string,
  settings: Settings,
): Promise<void> {
  const supabase = createClient();

  // user_id 가 PK 라 upsert 로 최초 저장과 재설정을 같은 경로로 처리한다.
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      injection_name: settings.injectionName,
      scheduled_hour: settings.scheduledHour,
      scheduled_minute: settings.scheduledMinute,
      start_date: settings.startDate,
      end_date: settings.endDate,
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
}
