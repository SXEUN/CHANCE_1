"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/AppFrame";
import { daysBetween, formatKorean } from "@/lib/date";
import { ensureSession, fetchSettings } from "@/lib/settings/remote";
import { readLocalSettings, writeLocalSettings } from "@/lib/settings/storage";
import { formatTime, type Settings } from "@/lib/settings/types";

/**
 * 진입 지점이자 관문.
 *
 * 설정이 없으면 설정 화면으로 보내고, 있으면 홈을 그린다.
 * 판단을 로컬 사본으로 먼저 하기 때문에 재방문 시 설정 화면이 번쩍이지 않는다.
 */
export default function HomePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const local = readLocalSettings();
      if (local) {
        if (!cancelled) {
          setSettings(local);
          setChecking(false);
        }
        return;
      }

      try {
        await ensureSession();
        const remote = await fetchSettings();

        if (cancelled) return;

        if (remote) {
          // 기기를 바꾸거나 캐시를 지운 경우. 로컬 사본을 다시 채워준다.
          writeLocalSettings(remote);
          setSettings(remote);
          setChecking(false);
        } else {
          router.replace("/setup");
        }
      } catch {
        // 세션조차 못 만들면 설정부터 다시 하게 한다.
        if (!cancelled) router.replace("/setup");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !settings) {
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
      <header className="flex items-center justify-between px-6 pt-8 pb-1">
        <div className="w-9" />
        <h1 className="text-[1.4rem] font-bold tracking-tight text-ink">
          주사 일지
        </h1>
        <Link
          href="/setup"
          aria-label="설정"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-canvas-deep hover:text-ink active:scale-90"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </g>
          </svg>
        </Link>
      </header>

      <div className="animate-rise flex-1 px-6 pt-6 pb-10">
        <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
          <p className="text-[0.75rem] font-medium tracking-wide text-ink-muted">
            내 설정
          </p>
          <p className="mt-2 text-[1.15rem] font-bold tracking-tight text-ink">
            {settings.injectionName}
          </p>

          <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-[0.85rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">투여 시각</dt>
              <dd className="tabular font-medium text-ink-soft">
                {formatTime(settings.scheduledHour, settings.scheduledMinute)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-ink-muted">투여 기간</dt>
              <dd className="tabular text-right font-medium text-ink-soft">
                {formatKorean(settings.startDate)}
                <br />– {formatKorean(settings.endDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">총 기간</dt>
              <dd className="tabular font-medium text-ink-soft">
                {daysBetween(settings.startDate, settings.endDate)}일
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 px-1 text-center text-[0.8rem] leading-relaxed text-ink-muted">
          기록 화면은 다음 단계에서 이어집니다.
          <br />
          설정을 바꾸려면 오른쪽 위 톱니바퀴를 눌러주세요.
        </p>
      </div>
    </AppFrame>
  );
}
