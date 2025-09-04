'use client'

interface JsonLdProps {
  data: Record<string, any>
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "부름이",
  "description": "주변의 간단한 심부름을 수행하며 부수입을 얻을 수 있는 위치기반 플랫폼",
  "url": "https://burum-i.com",
  "logo": "https://burum-i.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "areaServed": "KR",
    "availableLanguage": "Korean"
  },
  "sameAs": [
    "https://www.instagram.com/burum_i",
    "https://www.facebook.com/burum_i"
  ]
}

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "부름이 심부름 매칭 서비스",
  "description": "주변의 간단한 심부름을 찾아 수행하고 부수입을 얻을 수 있는 위치기반 매칭 플랫폼",
  "provider": {
    "@type": "Organization",
    "name": "부름이"
  },
  "areaServed": {
    "@type": "Country",
    "name": "South Korea"
  },
  "serviceType": "심부름 매칭 플랫폼",
  "category": "Business Services"
}

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "부름이",
  "description": "주변의 간단한 심부름을 수행하며 부수입을 얻을 수 있는 위치기반 플랫폼",
  "url": "https://burum-i.com",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Any",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "permissions": "location",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  }
}