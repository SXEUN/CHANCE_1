"use client";

import { SITE_LABEL, SITE_SHORT, type InjectionSite } from "@/lib/logs/types";

type Props = {
  value: InjectionSite | null;
  recommended: InjectionSite;
  onChange: (site: InjectionSite) => void;
};

/**
 * 화면 좌표계는 "거울 방향"이다.
 *
 * 사용자가 거울을 볼 때 자신의 오른쪽은 거울 속에서도 오른쪽에 보인다.
 * 그래서 사용자 몸의 오른쪽(RIGHT)을 화면 오른쪽에 그린다. 해부학 정면도는
 * 좌우가 반대지만, 여기서는 환자가 자기 배를 내려다보며 위치를 맞추는 게
 * 목적이므로 거울 쪽이 맞다.
 */
const SITES: {
  site: InjectionSite;
  x: number;
  y: number;
  badgeX: number;
  badgeY: number;
}[] = [
  // 화면 왼쪽 = 사용자의 왼쪽
  { site: "LEFT", x: 97, y: 170, badgeX: 97, badgeY: 146 },
  // 화면 오른쪽 = 사용자의 오른쪽
  { site: "RIGHT", x: 163, y: 170, badgeX: 163, badgeY: 146 },
  // 배꼽 아래. 다리가 갈라지기 전이라 배지까지 몸통 위에 올라간다.
  { site: "LOWER", x: 130, y: 195, badgeX: 130, badgeY: 217 },
];

const NAVEL = { x: 130, y: 166 };

export function BodyMap({ value, recommended, onChange }: Props) {
  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 260 320"
        className="w-full"
        role="group"
        aria-label="주사 부위 선택. 거울 방향으로 그려져 있어 화면 오른쪽이 몸의 오른쪽입니다."
      >
        <defs>
          <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--skin)" />
            <stop offset="100%" stopColor="var(--skin-shade)" />
          </linearGradient>
        </defs>

        <g fill="url(#skinGrad)">
          {/* 머리 */}
          <ellipse cx="130" cy="33" rx="20" ry="24" />
          {/* 목 */}
          <path d="M120 52h20v18h-20z" />

          {/* 몸통 + 다리 */}
          <path
            d="M130 66
               C 150 66 166 74 170 86
               C 174 100 172 116 168 130
               C 164 144 160 152 160 160
               C 160 172 164 184 168 196
               C 172 210 172 240 170 268
               C 169 284 167 298 165 308
               C 164 313 160 314 154 314
               C 147 314 143 312 142 306
               C 139 286 136 250 133 224
               C 132 216 128 216 127 224
               C 124 250 121 286 118 306
               C 117 312 113 314 106 314
               C 100 314 96 313 95 308
               C 93 298 91 284 90 268
               C 88 240 88 210 92 196
               C 96 184 100 172 100 160
               C 100 152 96 144 92 130
               C 88 116 86 100 90 86
               C 94 74 110 66 130 66 Z"
          />

          {/* 팔 — 몸통과 살짝 떨어뜨려 실루엣이 뭉치지 않게 한다 */}
          <path
            d="M88 84
               C 78 90 72 106 68 126
               C 64 146 58 172 52 192
               C 49 202 46 210 44 216
               C 42 222 46 226 50 224
               C 54 222 56 216 58 210
               C 62 198 68 178 72 162
               C 76 146 82 116 88 100 Z"
          />
          <path
            d="M172 84
               C 182 90 188 106 192 126
               C 196 146 202 172 208 192
               C 211 202 214 210 216 216
               C 218 222 214 226 210 224
               C 206 222 204 216 202 210
               C 198 198 192 178 188 162
               C 184 146 178 116 172 100 Z"
          />

          {/* 손 */}
          <ellipse cx="47" cy="230" rx="9" ry="13" />
          <ellipse cx="213" cy="230" rx="9" ry="13" />
        </g>

        {/* 허리선 — 복부 위치를 눈으로 가늠하게 해주는 최소한의 단서 */}
        <path
          d="M104 152 Q130 158 156 152"
          fill="none"
          stroke="var(--skin-line)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* 배꼽 */}
        <circle cx={NAVEL.x} cy={NAVEL.y} r="3.4" fill="var(--skin-line)" />
        <circle cx={NAVEL.x} cy={NAVEL.y} r="1.6" fill="var(--ink)" opacity="0.35" />

        {/* 주사 부위 */}
        {SITES.map(({ site, x, y, badgeX, badgeY }) => {
          const selected = value === site;
          const isRecommended = recommended === site && !selected;

          return (
            <g key={site}>
              {/* 추천 표시. 선택되면 사라진다. */}
              {isRecommended && (
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.6"
                  className="animate-breathe"
                />
              )}

              <g
                role="button"
                tabIndex={0}
                aria-label={`${SITE_LABEL[site]}${isRecommended ? " (오늘의 추천)" : ""}`}
                aria-pressed={selected}
                onClick={() => onChange(site)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(site);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {/* 손가락이 닿는 영역. 보이는 원보다 넉넉해야 누르기 쉽다. */}
                <circle cx={x} cy={y} r="24" fill="transparent" />

                <circle
                  cx={x}
                  cy={y}
                  r="11"
                  fill={selected ? "var(--accent)" : "var(--surface)"}
                  stroke="var(--accent)"
                  strokeWidth="1.8"
                  style={{
                    transition: "fill 220ms var(--ease), r 220ms var(--ease-out)",
                  }}
                />

                {selected && (
                  <path
                    d={`M${x - 4.5} ${y} l3 3.2 l6-6.4`}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pop"
                  />
                )}

                {/* L / R / U 배지 */}
                <g>
                  <rect
                    x={badgeX - 10}
                    y={badgeY - 9}
                    width="20"
                    height="18"
                    rx="5"
                    fill={selected ? "var(--accent)" : "var(--accent-soft)"}
                    style={{ transition: "fill 220ms var(--ease)" }}
                  />
                  <text
                    x={badgeX}
                    y={badgeY + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={selected ? "white" : "var(--accent)"}
                    style={{ transition: "fill 220ms var(--ease)" }}
                  >
                    {SITE_SHORT[site]}
                  </text>
                </g>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
