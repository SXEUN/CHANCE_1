import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "주사 일지",
  description: "하루 한 번 주사를 기록하는 가장 간단한 방법",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 폰에서 입력창을 탭할 때 iOS 가 화면을 확대해버리는 걸 막는다.
  // 확대 자체를 금지하면 접근성이 나빠지므로 최대 배율은 열어둔다.
  maximumScale: 5,
  // 주소창까지 앱 색으로 칠해져 웹앱처럼 보인다.
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
