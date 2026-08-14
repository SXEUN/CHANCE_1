"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const ITEM_H = 44; // px
const VISIBLE = 5; // 홀수여야 가운데 칸이 생긴다
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

type ColumnProps = {
  label: string;
  options: string[];
  index: number;
  onIndexChange: (index: number) => void;
};

/**
 * 휠 한 칸.
 *
 * 직접 transform 을 계산하는 대신 브라우저의 스크롤 + scroll-snap 에 맡긴다.
 * 그래야 iOS 의 관성 스크롤과 안드로이드의 오버스크롤이 공짜로 따라오고,
 * 데스크톱에서는 휠/트랙패드가 그대로 동작한다.
 */
function WheelColumn({ label, options, index, onIndexChange }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  // 프로그램으로 스크롤시킬 때 그 스크롤이 다시 onIndexChange 를 부르는
  // 되먹임을 막는다.
  const settling = useRef(false);

  const scrollToIndex = useCallback((i: number, smooth: boolean) => {
    const el = ref.current;
    if (!el) return;
    settling.current = true;
    el.scrollTo({ top: i * ITEM_H, behavior: smooth ? "smooth" : "auto" });
    // 스크롤이 끝난 뒤 플래그를 푼다. scrollend 는 사파리 지원이 늦어 타이머로 받는다.
    window.setTimeout(() => {
      settling.current = false;
    }, smooth ? 420 : 60);
  }, []);

  // 첫 렌더에서 현재 값 위치로 즉시 이동한다(애니메이션 없이).
  useLayoutEffect(() => {
    scrollToIndex(index, false);
    // 마운트 시 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 바깥에서 값이 바뀌면(예: 저장된 설정 불러오기) 따라간다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const current = Math.round(el.scrollTop / ITEM_H);
    if (current !== index) scrollToIndex(index, true);
  }, [index, scrollToIndex]);

  function handleScroll() {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const el = ref.current;
      if (!el || settling.current) return;

      const next = Math.max(
        0,
        Math.min(options.length - 1, Math.round(el.scrollTop / ITEM_H)),
      );
      if (next !== index) onIndexChange(next);
    });
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <span className="mb-1 text-[0.68rem] font-medium tracking-wide text-ink-muted">
        {label}
      </span>
      <div
        ref={ref}
        onScroll={handleScroll}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onIndexChange(Math.min(index + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            onIndexChange(Math.max(index - 1, 0));
          }
        }}
        className="wheel w-full overflow-y-scroll rounded-[var(--radius-sm)]"
        style={{ height: VISIBLE * ITEM_H, scrollPaddingBlock: PAD }}
      >
        <div style={{ paddingTop: PAD, paddingBottom: PAD }}>
          {options.map((opt, i) => {
            const distance = Math.abs(i - index);
            return (
              <div
                key={opt}
                role="option"
                aria-selected={i === index}
                onClick={() => onIndexChange(i)}
                className="wheel-item tabular flex cursor-pointer items-center justify-center transition-all duration-200 ease-[var(--ease)]"
                style={{
                  height: ITEM_H,
                  // 가운데에서 멀어질수록 흐려지고 작아져 원통처럼 보인다.
                  opacity: distance === 0 ? 1 : distance === 1 ? 0.42 : 0.18,
                  transform: `scale(${distance === 0 ? 1 : distance === 1 ? 0.9 : 0.82})`,
                  fontWeight: distance === 0 ? 700 : 400,
                  color:
                    distance === 0 ? "var(--accent)" : "var(--ink-soft)",
                  fontSize: distance === 0 ? "1.2rem" : "1.05rem",
                }}
              >
                {opt}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type TimeValue = {
  meridiem: "AM" | "PM";
  hour12: number;
  minute: number;
};

const MERIDIEMS = ["오전", "오후"];
const HOURS = Array.from({ length: 12 }, (_, i) => `${i + 1}시`);
const MINUTES = Array.from(
  { length: 12 },
  (_, i) => `${String(i * 5).padStart(2, "0")}분`,
);

type Props = {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
};

export function TimeWheel({ value, onChange }: Props) {
  const [live, setLive] = useState("");

  const meridiemIndex = value.meridiem === "AM" ? 0 : 1;
  const hourIndex = value.hour12 - 1;
  const minuteIndex = Math.round(value.minute / 5);

  // 스크린리더에 현재 시각을 읽어준다. 휠은 시각적 단서라 이게 없으면
  // 무엇이 선택됐는지 알 수 없다.
  useEffect(() => {
    const label = value.meridiem === "AM" ? "오전" : "오후";
    setLive(
      `${label} ${value.hour12}시 ${String(value.minute).padStart(2, "0")}분`,
    );
  }, [value]);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-line bg-surface shadow-[var(--shadow-sm)]">
      {/* 가운데 선택 밴드. 휠보다 아래에 깔아 글자를 가리지 않는다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 z-0 rounded-[var(--radius-sm)] bg-accent-soft"
        style={{ height: ITEM_H, top: PAD + 22 }}
      />
      {/* 위아래 페이드. 휠이 상자 안으로 말려 들어가는 느낌을 만든다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-surface to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-surface to-transparent"
      />

      <div className="relative z-10 flex px-2 pt-2 pb-1">
        <WheelColumn
          label="오전/오후"
          options={MERIDIEMS}
          index={meridiemIndex}
          onIndexChange={(i) =>
            onChange({ ...value, meridiem: i === 0 ? "AM" : "PM" })
          }
        />
        <div aria-hidden="true" className="my-8 w-px shrink-0 bg-line" />
        <WheelColumn
          label="시"
          options={HOURS}
          index={hourIndex}
          onIndexChange={(i) => onChange({ ...value, hour12: i + 1 })}
        />
        <div aria-hidden="true" className="my-8 w-px shrink-0 bg-line" />
        <WheelColumn
          label="분"
          options={MINUTES}
          index={minuteIndex}
          onIndexChange={(i) => onChange({ ...value, minute: i * 5 })}
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </div>
  );
}
