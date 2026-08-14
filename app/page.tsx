"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/AppFrame";
import { GearIcon } from "@/components/icons";
import { addMonths, fromKey, startOfMonth, toKey, today } from "@/lib/date";
import { fetchLogs } from "@/lib/logs/remote";
import { SITE_SHORT, type InjectionLog } from "@/lib/logs/types";
import { ensureSession, fetchSettings } from "@/lib/settings/remote";
import { readLocalSettings, writeLocalSettings } from "@/lib/settings/storage";
import type { Settings } from "@/lib/settings/types";

/** 오늘을 가운데 두고 앞뒤로 몇 달치를 그릴지. */
const MONTHS_BACK = 2;
const MONTHS_FORWARD = 2;

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export default function DatePickerPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [logs, setLogs] = useState<InjectionLog[]>([]);
  const [checking, setChecking] = useState(true);

  const todayKey = useMemo(() => toKey(today()), []);
  const [selected, setSelected] = useState(todayKey);

  const listRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  // 오늘을 기준으로 앞뒤 몇 달치 날짜를 한 줄로 펼친다.
  const days = useMemo(() => {
    const start = startOfMonth(addMonths(today(), -MONTHS_BACK));
    const endMonth = addMonths(today(), MONTHS_FORWARD);
    const end = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0);

    const out: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const local = readLocalSettings();
      if (local && !cancelled) setSettings(local);

      try {
        await ensureSession();

        if (!local) {
          const remote = await fetchSettings();
          if (cancelled) return;
          if (!remote) {
            router.replace("/setup");
            return;
          }
          writeLocalSettings(remote);
          setSettings(remote);
        }

        const from = toKey(days[0]);
        const to = toKey(days[days.length - 1]);
        const rows = await fetchLogs(from, to);
        if (!cancelled) setLogs(rows);
      } catch {
        if (!cancelled && !local) router.replace("/setup");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, days]);

  // 목록이 그려지면 오늘 줄로 스크롤한다. 사용자가 매일 여는 화면이라
  // 열자마자 오늘이 눈앞에 있어야 한다.
  useEffect(() => {
    if (checking) return;
    todayRef.current?.scrollIntoView({ block: "center" });
  }, [checking]);

  const logByDate = useMemo(() => {
    const map = new Map<string, InjectionLog>();
    for (const l of logs) map.set(l.date, l);
    return map;
  }, [logs]);

  if (checking && !settings) {
    return (
      <AppFrame>
        <div className="flex flex-1 items-center justify-center">
          <span className="sr-only">불러오는 중</span>
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <header className="flex shrink-0 items-start justify-between px-6 pt-8 pb-4">
        <div className="w-9 shrink-0" />
        <div className="min-w-0 text-center">
          <h1 className="text-[1.35rem] font-bold tracking-tight text-ink">
            날짜 선택
          </h1>
          <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink-muted">
            기록을 확인하거나 새로 주사를 투여할
            <br />
            날짜를 선택해주세요
          </p>
        </div>
        <Link
          href="/setup"
          aria-label="설정"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-canvas-deep hover:text-ink active:scale-90"
        >
          <GearIcon />
        </Link>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4"
      >
        {days.map((date, i) => {
          const key = toKey(date);
          const log = logByDate.get(key);
          const isToday = key === todayKey;
          const isSelected = key === selected;
          const monthChanged =
            i === 0 || date.getMonth() !== days[i - 1].getMonth();

          const inPeriod =
            !!settings && key >= settings.startDate && key <= settings.endDate;

          return (
            <div key={key}>
              {monthChanged && (
                <div className="sticky top-0 z-10 -mx-1 bg-canvas/95 px-1 py-2 backdrop-blur-sm">
                  <span className="tabular text-[0.78rem] font-bold tracking-tight text-ink-soft">
                    {date.getFullYear()}년 {date.getMonth() + 1}월
                  </span>
                </div>
              )}

              <button
                type="button"
                ref={isToday ? todayRef : undefined}
                onClick={() => setSelected(key)}
                aria-pressed={isSelected}
                className={[
                  "mb-2 flex w-full items-center justify-between gap-3 rounded-[var(--radius)] border px-4 py-3.5 text-left transition-all duration-200 ease-[var(--ease-out)] active:scale-[0.99]",
                  isSelected
                    ? "border-accent bg-accent text-white shadow-[var(--shadow)]"
                    : "border-line bg-surface hover:border-line-strong",
                ].join(" ")}
              >
                <span className="min-w-0">
                  <span
                    className={[
                      "tabular block text-[1rem] font-bold tracking-tight",
                      isSelected ? "text-white" : "text-ink",
                    ].join(" ")}
                  >
                    {date.getFullYear()}년 {date.getMonth() + 1}월{" "}
                    {date.getDate()}일
                  </span>
                  <span
                    className={[
                      "mt-0.5 block text-[0.78rem]",
                      isSelected ? "text-white/70" : "text-ink-muted",
                    ].join(" ")}
                  >
                    {WEEKDAYS[date.getDay()]}
                    {isToday && " · 오늘"}
                  </span>
                </span>

                <StatusBadge
                  log={log}
                  isToday={isToday}
                  isSelected={isSelected}
                  isFuture={key > todayKey}
                  inPeriod={inPeriod}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 bg-gradient-to-t from-canvas via-canvas to-transparent px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => router.push(`/site/${selected}`)}
          className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-accent text-[1rem] font-bold text-white shadow-[var(--shadow)] transition-all duration-250 ease-[var(--ease-out)] hover:brightness-110 active:scale-[0.98]"
        >
          다음으로 이동
        </button>
      </div>
    </AppFrame>
  );
}

function StatusBadge({
  log,
  isToday,
  isSelected,
  isFuture,
  inPeriod,
}: {
  log: InjectionLog | undefined;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  inPeriod: boolean;
}) {
  const base =
    "shrink-0 rounded-full px-2.5 py-1 text-[0.72rem] font-medium whitespace-nowrap";

  if (log) {
    return (
      <span
        className={[
          base,
          isSelected ? "bg-white/20 text-white" : "bg-accent-soft text-accent",
        ].join(" ")}
      >
        주사 완료 · {SITE_SHORT[log.site]}
      </span>
    );
  }

  if (isToday) {
    return (
      <span
        className={[
          base,
          isSelected
            ? "bg-white/20 text-white"
            : "bg-accent-end-soft text-accent-end",
        ].join(" ")}
      >
        오늘
      </span>
    );
  }

  if (isFuture && inPeriod) {
    return (
      <span
        className={[
          base,
          isSelected ? "bg-white/15 text-white/80" : "bg-canvas-deep text-ink-muted",
        ].join(" ")}
      >
        주사 예정
      </span>
    );
  }

  return null;
}
