"use client";

import { useMemo, useState } from "react";

import {
  addMonths,
  buildMonthGrid,
  fromKey,
  isSameDay,
  startOfMonth,
  toKey,
  today,
  WEEKDAY_LABELS,
} from "@/lib/date";

type Props = {
  startDate: string | null;
  endDate: string | null;
  onChange: (next: { startDate: string | null; endDate: string | null }) => void;
};

export function RangeCalendar({ startDate, endDate, onChange }: Props) {
  const [month, setMonth] = useState(() =>
    startOfMonth(startDate ? fromKey(startDate) : today()),
  );
  // 달을 넘긴 방향에 따라 들어오는 애니메이션을 바꾼다.
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const now = today();

  function shift(delta: number) {
    setDirection(delta > 0 ? "next" : "prev");
    setMonth((m) => addMonths(m, delta));
  }

  function handlePick(date: Date) {
    const key = toKey(date);

    // 시작만 정해진 상태에서 그 이후 날짜를 누르면 종료일이 된다.
    // 그 외에는 항상 새 기간의 시작으로 잡는다 — 다시 고르기가 쉬워야 한다.
    if (startDate && !endDate && key >= startDate) {
      onChange({ startDate, endDate: key });
    } else {
      onChange({ startDate: key, endDate: null });
    }
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between px-2 py-2.5">
        <NavButton label="이전 달" onClick={() => shift(-1)}>
          <path d="M12.5 15 7.5 10l5-5" />
        </NavButton>

        <div
          key={`${month.getFullYear()}-${month.getMonth()}`}
          className={
            direction === "next" ? "animate-from-right" : "animate-from-left"
          }
        >
          <span className="tabular text-[0.98rem] font-medium text-ink">
            {month.getFullYear()}년 {month.getMonth() + 1}월
          </span>
        </div>

        <NavButton label="다음 달" onClick={() => shift(1)}>
          <path d="M7.5 5l5 5-5 5" />
        </NavButton>
      </div>

      <div className="grid grid-cols-7 px-1.5 pb-1">
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={[
              "py-1.5 text-center text-[0.72rem] font-medium",
              i === 0 ? "text-danger/70" : "",
              i === 6 ? "text-accent/70" : "",
              i > 0 && i < 6 ? "text-ink-muted" : "",
            ].join(" ")}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        key={`grid-${month.getFullYear()}-${month.getMonth()}`}
        className={[
          "grid grid-cols-7 gap-y-0.5 px-1.5 pb-2",
          direction === "next" ? "animate-from-right" : "animate-from-left",
        ].join(" ")}
      >
        {grid.map((date) => {
          const key = toKey(date);
          const outside = date.getMonth() !== month.getMonth();

          const isStart = startDate === key;
          const isEnd = endDate === key;
          const inRange =
            !!startDate && !!endDate && key > startDate && key < endDate;

          return (
            <button
              type="button"
              key={key}
              onClick={() => handlePick(date)}
              aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
              aria-pressed={isStart || isEnd}
              className="relative flex h-11 items-center justify-center"
            >
              {/* 기간 배경. 셀 전체 폭을 덮어야 날짜 사이가 끊겨 보이지 않는다. */}
              {(inRange || isStart || isEnd) && (
                <span
                  aria-hidden="true"
                  className={[
                    "absolute inset-y-1 bg-accent-soft transition-all duration-300 ease-[var(--ease-out)]",
                    isStart && endDate ? "left-1/2 right-0" : "",
                    isEnd ? "left-0 right-1/2" : "",
                    inRange ? "inset-x-0" : "",
                    isStart && !endDate ? "hidden" : "",
                  ].join(" ")}
                />
              )}

              <span
                className={[
                  "tabular relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-[0.9rem] transition-all duration-200 ease-[var(--ease-out)]",
                  outside ? "text-ink-muted/35" : "text-ink-soft",
                  isStart
                    ? "animate-pop bg-accent font-bold text-white shadow-[0_2px_8px_-2px_var(--accent)]"
                    : "",
                  isEnd
                    ? "animate-pop bg-accent-end font-bold text-white shadow-[0_2px_8px_-2px_var(--accent-end)]"
                    : "",
                  inRange ? "font-medium text-accent" : "",
                  !isStart && !isEnd && !inRange && !outside
                    ? "hover:bg-canvas-deep"
                    : "",
                ].join(" ")}
              >
                {date.getDate()}
                {/* 오늘 표시 */}
                {isSameDay(date, now) && !isStart && !isEnd && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 h-1 w-1 rounded-full bg-accent"
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-canvas-deep hover:text-ink active:scale-90"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {children}
        </g>
      </svg>
    </button>
  );
}
