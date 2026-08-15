"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/AppFrame";
import { BackIcon, GearIcon, InfoIcon } from "@/components/icons";
import { BodyMap } from "@/components/site/BodyMap";
import { addMonths, formatKorean, startOfMonth, toKey, today } from "@/lib/date";
import { fetchLogs, saveLog } from "@/lib/logs/remote";
import {
  recommendSite,
  SITE_LABEL,
  SITE_SHORT,
  type InjectionSite,
} from "@/lib/logs/types";
import { ensureSession } from "@/lib/settings/remote";

export function SitePicker({ date }: { date: string }) {
  const router = useRouter();

  const [selected, setSelected] = useState<InjectionSite | null>(null);
  const [recommended, setRecommended] = useState<InjectionSite>("RIGHT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isToday = useMemo(() => date === toKey(today()), [date]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await ensureSession();

        // 추천은 "직전 기록의 반대쪽"이라 과거 기록이 필요하다.
        // 석 달치면 번갈아 순서를 판단하기에 충분하고, 한 번의 요청으로 끝난다.
        const from = toKey(startOfMonth(addMonths(new Date(date), -3)));
        const logs = await fetchLogs(from, date);
        if (cancelled) return;

        const existing = logs.find((l) => l.date === date);
        if (existing) setSelected(existing.site);
        setRecommended(recommendSite(logs, date));
      } catch {
        // 기록을 못 읽어도 선택은 할 수 있어야 한다. 추천만 기본값으로 둔다.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date]);

  async function handleSave() {
    if (!selected) return;

    setSaving(true);
    setError(null);
    try {
      const userId = await ensureSession();
      await saveLog(userId, date, selected);
      router.push("/");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
      setSaving(false);
    }
  }

  return (
    <AppFrame>
      <header className="flex shrink-0 items-start justify-between px-5 pt-8 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-canvas-deep hover:text-ink active:scale-90"
        >
          <BackIcon />
        </button>

        <div className="min-w-0 px-1 text-center">
          <h1 className="text-[1.12rem] leading-snug font-bold tracking-tight text-ink">
            주사 맞는 부위 선택
            <br />
            <span className="text-accent">*거울 방향*</span>
            <span className="text-ink">(전면)</span>
          </h1>
        </div>

        <Link
          href="/setup"
          aria-label="설정"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-canvas-deep hover:text-ink active:scale-90"
        >
          <GearIcon />
        </Link>
      </header>

      <p className="shrink-0 px-7 pb-1 text-center text-[0.76rem] leading-relaxed text-ink-muted">
        (거울처럼 생각해주세요. 그리고 복부 좌우 부위를 터치해 오늘 맞을 위치를
        조절하세요.)
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-4">
        <p className="tabular mb-3 text-center text-[0.82rem] font-medium text-ink-soft">
          {formatKorean(date)}
          {isToday && <span className="text-accent"> · 오늘</span>}
        </p>

        <div className="animate-fade rounded-[var(--radius-lg)] border border-line bg-surface px-4 py-3 shadow-[var(--shadow-sm)]">
          <BodyMap
            value={selected}
            recommended={recommended}
            onChange={setSelected}
          />
        </div>

        {!loading && (
          <div
            className={[
              "animate-rise mt-3 flex items-start gap-2 rounded-[var(--radius)] px-3.5 py-2.5 text-[0.8rem] leading-relaxed",
              selected
                ? "bg-accent-soft text-accent"
                : "bg-canvas-deep/70 text-ink-soft",
            ].join(" ")}
          >
            <span className="mt-0.5">
              <InfoIcon />
            </span>
            <span>
              {selected ? (
                <>
                  <b className="font-bold">
                    {SITE_LABEL[selected]}({SITE_SHORT[selected]})
                  </b>
                  를 선택했습니다.
                </>
              ) : (
                <>
                  <b className="font-bold text-accent">
                    {SITE_LABEL[recommended]}({SITE_SHORT[recommended]})
                  </b>{" "}
                  부위가 오늘의 추천 위치입니다.
                </>
              )}
            </span>
          </div>
        )}

        <p className="mt-3 px-1 text-center text-[0.72rem] leading-relaxed text-ink-muted">
          같은 자리에 반복하면 멍과 경결이 생기기 쉬워
          <br />
          우측 → 좌측 → 하복부 순으로 매일 돌아가며 추천합니다.
        </p>
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 bg-gradient-to-t from-canvas via-canvas to-transparent px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {error && (
          <p
            role="alert"
            className="animate-rise mb-3 rounded-[var(--radius-sm)] bg-danger/8 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-danger"
          >
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!selected || saving}
          className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-accent text-[1rem] font-bold text-white shadow-[var(--shadow)] transition-all duration-250 ease-[var(--ease-out)] enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-muted disabled:shadow-none"
        >
          {saving ? (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="2.5"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            "위치 선택 완료"
          )}
        </button>
      </div>
    </AppFrame>
  );
}
