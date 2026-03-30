import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "법령 도우미 (데이터 기반)",
  description:
    "주택임대차보호법 관련 질문에 대해 미리 정리된 데이터와 규칙 기반 검색으로 안내합니다. 법률 자문이 아닙니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
