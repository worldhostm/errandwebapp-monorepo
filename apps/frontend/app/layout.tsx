import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "부름이 - 주변 심부름으로 부수입 벌기",
  description: "부름이는 주변의 간단한 심부름을 수행하며 부수입을 얻을 수 있는 위치기반 플랫폼입니다. 가까운 곳의 심부름을 찾아 수행하고 수익을 얻어보세요.",
  keywords: ["심부름", "부수입", "알바", "위치기반", "일자리", "사이드잡", "부름이"],
  authors: [{ name: "부름이" }],
  creator: "부름이",
  publisher: "부름이",
  applicationName: "부름이",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Business",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "부름이",
    title: "부름이 - 주변 심부름으로 부수입 벌기",
    description: "부름이는 주변의 간단한 심부름을 수행하며 부수입을 얻을 수 있는 위치기반 플랫폼입니다. 가까운 곳의 심부름을 찾아 수행하고 수익을 얻어보세요.",
    locale: "ko_KR",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "부름이 - 주변 심부름으로 부수입 벌기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "부름이 - 주변 심부름으로 부수입 벌기",
    description: "부름이는 주변의 간단한 심부름을 수행하며 부수입을 얻을 수 있는 위치기반 플랫폼입니다.",
    images: ["/images/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code",
    other: {
      "naver-site-verification": "naver-verification-code",
    },
  },
  alternates: {
    canonical: "https://burum-i.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services&autoload=false`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
