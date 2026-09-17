import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Script from "next/script";

const a2g = localFont({
  src: [
    { path: "../public/font/에이투지체-3Light.woff2",    weight: "300", style: "normal" },
    { path: "../public/font/에이투지체-4Regular.woff2",  weight: "400", style: "normal" },
    { path: "../public/font/에이투지체-5Medium.woff2",   weight: "500", style: "normal" },
    { path: "../public/font/에이투지체-6SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/font/에이투지체-7Bold.woff2",     weight: "700", style: "normal" },
  ],
  variable: "--font-a2g",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://burum-i.com"),
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
    <html lang="ko" data-theme="lemonade" className={a2g.variable}>
      <body className="antialiased">
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services&autoload=false`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
