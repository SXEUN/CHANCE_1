"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/AppFrame";
import { InjectionSelect } from "@/components/setup/InjectionSelect";
import { RangeCalendar } from "@/components/setup/RangeCalendar";
import { TimeWheel, type TimeValue } from "@/components/setup/TimeWheel";
import { daysBetween, formatKorean } from "@/lib/date";
import type { InjectionName } from "@/lib/injections";
import { ensureSession, fetchSettings, saveSettings } from "@/lib/settings/remote";
import { readLocalSettings, writeLocalSettings } from "@/lib/settings/storage";
import { toHour24, toMeridiem, type Settings } from "@/lib/settings/types";

export default function SetupPage() {
  const router = useRouter();

  const [injectionName, setInjectionName] = useState<InjectionName | null>(null);
  const [time, setTime] = useState<TimeValue>({
    meridiem: "PM",
    hour12: 8,
    minute: 0,
  });
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자가 뭔가 건드린 뒤에는 늦게 도착한 서버 값이 입력을 덮어쓰면 안 된다.
  const touched = useRef(false);

  // 이미 저장한 설정이 있으면 그 값으로 채운다(설정 다시 열기).
  useEffect(() => {
    let cancelled = false;

    function apply(s: Settings) {
      const { meridiem, hour12 } = toMeridiem(s.scheduledHour);
      setInjectionName(s.injectionName);
      setTime({ meridiem, hour12, minute: s.scheduledMinute });
      setStartDate(s.startDate);
      setEndDate(s.endDate);
    }

    const local = readLocalSettings();
    if (local) apply(local);

    // 폼을 먼저 띄운다. 여기서 네트워크를 기다리면 첫 화면이 그만큼 늦어지는데,
    // 어차피 / 가 서버를 확인한 뒤에야 이리로 보내주므로 기다릴 이유가 없다.
    setHydrated(true);

    // 로컬 사본이 없는 경우에만(기기 변경 등) 서버를 뒤늦게 확인해 채워준다.
    if (!local) {
      fetchSettings()
        .then((remote) => {
          if (!cancelled && remote && !touched.current) apply(remote);
        })
        .catch(() => {
          /* 없으면 그냥 빈 폼으로 시작한다 */
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const complete = Boolean(injectionName && startDate && endDate);

  async function handleSave() {
    if (!complete || !injectionName || !startDate || !endDate) return;

    setSaving(true);
    setError(null);

    const settings = {
      injectionName,
      scheduledHour: toHour24(time.meridiem, time.hour12),
      scheduledMinute: time.minute,
      startDate,
      endDate,
    };

    try {
      const userId = await ensureSession();
      await saveSettings(userId, settings);
      // 서버에 들어간 뒤에 로컬에 쓴다. 순서가 반대면 저장에 실패했는데도
      // 다음 방문에 설정 화면을 건너뛰게 된다.
      writeLocalSettings(settings);
      router.replace("/");
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
      <header className="shrink-0 px-6 pt-8 pb-1 text-center">
        <h1 className="text-[1.4rem] font-bold tracking-tight text-ink">설정</h1>
        <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-muted">
          처음 한 번만 정해두면 됩니다
        </p>
      </header>

      {!hydrated ? (
        <SetupSkeleton />
      ) : (
        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 pt-6 pb-10">
          {/* 드롭다운이 아래 두 섹션 위로 펼쳐져야 한다. */}
          <Field label="주사 명칭" step={1} layer={20}>
            <InjectionSelect
              value={injectionName}
              onChange={(v) => {
                touched.current = true;
                setInjectionName(v);
              }}
            />
          </Field>

          <Field label="투여 시각" step={2}>
            <TimeWheel
              value={time}
              onChange={(v) => {
                touched.current = true;
                setTime(v);
              }}
            />
          </Field>

          <Field label="투여 기간" step={3}>
            <RangeCalendar
              startDate={startDate}
              endDate={endDate}
              onChange={(next) => {
                touched.current = true;
                setStartDate(next.startDate);
                setEndDate(next.endDate);
              }}
            />
            <RangeSummary startDate={startDate} endDate={endDate} />
          </Field>
        </div>
      )}

      {/* 저장 버튼은 항상 손가락이 닿는 곳에 둔다. */}
      <div className="z-20 shrink-0 bg-gradient-to-t from-canvas via-canvas to-transparent px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
          disabled={!complete || saving}
          className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-accent text-[1rem] font-bold text-white shadow-[var(--shadow)] transition-all duration-250 ease-[var(--ease-out)] enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-muted disabled:shadow-none"
        >
          {saving ? <Spinner /> : "설정 저장"}
        </button>
      </div>
    </AppFrame>
  );
}

function Field({
  label,
  step,
  layer = 0,
  children,
}: {
  label: string;
  step: number;
  /**
   * 겹침 순서. 기본은 DOM 순서대로 뒤 섹션이 위에 그려지는데,
   * 드롭다운처럼 아래 섹션을 덮어야 하는 요소가 있으면 이 값을 올린다.
   * animate-rise 가 섹션마다 쌓임 맥락을 만들기 때문에 자식의 z-index 만으로는
   * 섹션 경계를 넘지 못한다.
   */
  layer?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="animate-rise relative space-y-2.5"
      style={{ animationDelay: `${step * 70}ms`, zIndex: layer }}
    >
      <h2 className="px-0.5 text-[0.85rem] font-medium tracking-tight text-ink-soft">
        {label}
      </h2>
      {children}
    </section>
  );
}

function RangeSummary({
  startDate,
  endDate,
}: {
  startDate: string | null;
  endDate: string | null;
}) {
  if (!startDate) {
    return (
      <p className="px-1 pt-1 text-[0.8rem] text-ink-muted">
        시작일을 선택해주세요
      </p>
    );
  }

  if (!endDate) {
    return (
      <p className="animate-fade px-1 pt-1 text-[0.8rem] text-ink-muted">
        <span className="font-medium text-accent">
          {formatKorean(startDate)}
        </span>{" "}
        시작 · 이제 종료일을 선택해주세요
      </p>
    );
  }

  return (
    <div className="animate-fade flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-canvas-deep/60 px-3.5 py-2.5">
      <div className="flex min-w-0 items-center gap-2 text-[0.8rem]">
        <span className="font-medium text-accent">
          {formatKorean(startDate)}
        </span>
        <span className="text-ink-muted">–</span>
        <span className="font-medium text-accent-end">
          {formatKorean(endDate)}
        </span>
      </div>
      <span className="tabular shrink-0 text-[0.8rem] font-bold text-ink-soft">
        {daysBetween(startDate, endDate)}일
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 animate-spin">
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
  );
}

function SetupSkeleton() {
  return (
    <div className="flex-1 space-y-7 px-6 pt-6 pb-40">
      {[56, 220, 320].map((h, i) => (
        <div key={i} className="space-y-2.5">
          <div className="h-3.5 w-20 animate-pulse rounded bg-canvas-deep" />
          <div
            className="animate-pulse rounded-[var(--radius)] bg-canvas-deep"
            style={{ height: h }}
          />
        </div>
      ))}
    </div>
  );
}
