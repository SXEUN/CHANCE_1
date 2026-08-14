"use client";

import { useEffect, useId, useRef, useState } from "react";

import { INJECTIONS, type InjectionName } from "@/lib/injections";

type Props = {
  value: InjectionName | null;
  onChange: (value: InjectionName) => void;
};

/**
 * 네이티브 <select> 대신 직접 만든 이유:
 * iOS 는 하단 휠, 안드로이드는 가운데 다이얼로그, PC 는 회색 목록으로
 * 제각각 그려서 화면 인상이 기기마다 달라진다. 13개뿐이라 직접 그리는
 * 비용도 크지 않다. 대신 키보드 조작과 스크린리더 대응은 직접 채운다.
 */
export function InjectionSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  // 바깥을 누르거나 Esc 를 누르면 닫는다.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // 열릴 때 현재 선택된 항목으로 스크롤을 맞추고, 키보드 조작이 바로
  // 먹도록 목록에 포커스를 준다.
  useEffect(() => {
    if (!open) return;
    const raw = value ? INJECTIONS.indexOf(value) : 0;
    const index = raw < 0 ? 0 : raw;
    setActiveIndex(index);
    requestAnimationFrame(() => {
      listRef.current?.focus({ preventScroll: true });
      listRef.current
        ?.querySelectorAll("li")
        [index]?.scrollIntoView({ block: "nearest" });
    });
  }, [open, value]);

  function commit(index: number) {
    onChange(INJECTIONS[index]);
    setOpen(false);
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, INJECTIONS.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(activeIndex);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(INJECTIONS.length - 1);
    }
  }

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelectorAll("li")
      [activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className="flex w-full items-center justify-between gap-3 rounded-[var(--radius)] border border-line bg-surface px-4 py-3.5 text-left shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-line-strong active:scale-[0.995] data-[open=true]:border-accent data-[open=true]:shadow-[0_0_0_3px_var(--accent-ring)]"
        data-open={open}
      >
        <span
          className={
            value
              ? "text-[0.975rem] font-medium text-ink"
              : "text-[0.975rem] text-ink-muted"
          }
        >
          {value ?? "주사를 선택해주세요"}
        </span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-ink-muted transition-transform duration-300 ease-[var(--ease-out)]"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label="주사 명칭"
          aria-activedescendant={`${listId}-${activeIndex}`}
          onKeyDown={onListKeyDown}
          className="animate-drop absolute z-30 mt-2 max-h-64 w-full overflow-y-auto overscroll-contain rounded-[var(--radius)] border border-line bg-surface py-1.5 shadow-[var(--shadow-lg)]"
        >
          {INJECTIONS.map((name, i) => {
            const selected = name === value;
            const active = i === activeIndex;
            return (
              <li
                key={name}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onClick={() => commit(i)}
                onPointerEnter={() => setActiveIndex(i)}
                className={[
                  "flex cursor-pointer items-center justify-between px-4 py-2.5 text-[0.94rem] transition-colors duration-150",
                  active ? "bg-canvas-deep/70" : "",
                  selected ? "font-medium text-accent" : "text-ink-soft",
                ].join(" ")}
              >
                <span>{name}</span>
                {selected && (
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="animate-pop h-4 w-4"
                  >
                    <path
                      d="M4.5 10.5 8 14l7.5-8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
