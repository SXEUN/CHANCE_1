import { createClient } from "@/lib/supabase/client";

import type { InjectionLog, InjectionSite } from "./types";

/**
 * 기간 안의 기록을 통째로 읽는다.
 *
 * 날짜 목록 화면이 한 번에 여러 달을 그리므로, 날짜마다 한 번씩 묻는 대신
 * 범위로 한 번에 받아 화면에서 붙인다.
 */
export async function fetchLogs(
  fromDate: string,
  toDate: string,
): Promise<InjectionLog[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("injection_logs")
    .select("log_date, site")
    .gte("log_date", fromDate)
    .lte("log_date", toDate)
    .order("log_date", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    date: row.log_date as string,
    site: row.site as InjectionSite,
  }));
}

export async function saveLog(
  userId: string,
  date: string,
  site: InjectionSite,
): Promise<void> {
  const supabase = createClient();

  // (user_id, log_date) 가 PK 라 같은 날 다시 저장하면 부위만 바뀐다.
  const { error } = await supabase.from("injection_logs").upsert(
    { user_id: userId, log_date: date, site },
    { onConflict: "user_id,log_date" },
  );

  if (error) throw new Error(error.message);
}
