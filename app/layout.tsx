import type { Metadata, Viewport } from "next";
import "./globals.css";

/*
  웹폰트를 쓰지 않고 각 OS 의 기본 한글 서체를 쓴다.
  - iOS/macOS : Apple SD Gothic Neo
  - Android   : Noto Sans KR
  - Windows   : 맑은 고딕
  구체적인 스택은 globals.css 의 --font-sans 에 있다.

  next/font/google 로 Noto Sans KR 을 받아오면 한글 서브셋이 100개가 넘어
  첫 화면에서 폰트가 늦게 바뀌고, 빌드 시점에 구글 서버 상태에 의존하게 된다.
  기기 기본 서체는 즉시 그려지고 사용자에게도 가장 익숙하다.
*/

export const metadata: Metadata = {
  title: "주사 일지",
  description: "하루 한 번 주사를 기록하는 가장 간단한 방법",
  // 홈 화면에 추가했을 때 브라우저 UI 없이 앱처럼 열린다.
  appleWebApp: {
    capable: true,
    title: "주사 일지",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 입력창을 탭할 때 iOS 가 화면을 확대하는 걸 막되,
  // 확대 자체는 막지 않는다(접근성).
  maximumScale: 5,
  themeColor: "#f7f5f2",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
