/**
 * 화면 폭을 잡아주는 껍데기.
 *
 * 모바일에서는 화면을 꽉 채우고, 넓은 화면에서는 한가운데에 폰 너비로 세운다.
 * PC 에서 폼이 가로로 늘어지면 시선이 흩어져서 읽기가 나빠진다.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-canvas">
      <div className="relative flex w-full max-w-[26rem] flex-col bg-canvas sm:my-6 sm:min-h-0 sm:rounded-[var(--radius-xl)] sm:shadow-[var(--shadow-lg)]">
        {children}
      </div>
    </div>
  );
}
