/**
 * 화면 폭과 높이를 잡아주는 껍데기.
 *
 * 높이를 뷰포트에 고정한다. 그래야 안쪽의 목록이 자기 영역 안에서만 구르고
 * 헤더와 하단 버튼이 제자리에 붙어 있는다. min-h 로만 두면 목록이 길어질 때
 * 페이지 전체가 늘어나 버튼이 화면 밖으로 밀려난다.
 *
 * 넓은 화면에서는 한가운데 폰 너비로 세운다. PC 에서 폼이 가로로 늘어지면
 * 시선이 흩어져 읽기가 나빠진다.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh justify-center bg-canvas sm:py-6">
      <div className="relative flex h-full w-full max-w-[26rem] flex-col overflow-hidden bg-canvas sm:rounded-[var(--radius-xl)] sm:shadow-[var(--shadow-lg)]">
        {children}
      </div>
    </div>
  );
}
