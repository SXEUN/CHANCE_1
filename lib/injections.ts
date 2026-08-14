/**
 * 난임 치료에 쓰이는 자가주사 13종.
 * 사용자가 약봉투/처방전에 적힌 이름을 그대로 찾을 수 있어야 하므로
 * 표기(영문 대문자, 언더바 포함)를 임의로 정리하지 않고 받은 그대로 둔다.
 */
export const INJECTIONS = [
  "프롤루텍스",
  "폴리트롭",
  "퍼고베리스",
  "세트로타이드",
  "레코벨",
  "오비드렐",
  "PUREGON",
  "Orgalutran",
  "IVF-M HP_멀티도즈",
  "IVF-M HP",
  "유트로핀",
  "Ganilever",
  "고날에프",
] as const;

export type InjectionName = (typeof INJECTIONS)[number];

export function isInjectionName(value: unknown): value is InjectionName {
  return (
    typeof value === "string" &&
    (INJECTIONS as readonly string[]).includes(value)
  );
}
