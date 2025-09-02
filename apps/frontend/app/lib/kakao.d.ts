interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

interface KakaoMap {
  getLevel(): number
  setLevel(level: number): void
  getCenter(): KakaoLatLng
  setCenter(latlng: KakaoLatLng): void
  getBounds(): {
    getSouthWest(): KakaoLatLng
    getNorthEast(): KakaoLatLng
  }
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void
  getPosition(): KakaoLatLng
  setPosition(latlng: KakaoLatLng): void
}

interface KakaoMarkerImage {
  src: string
  size: KakaoSize
}

interface KakaoSize {
  width: number
  height: number
}

interface KakaoPlaces {
  keywordSearch(
    keyword: string,
    callback: (result: Array<{
      place_name: string
      address_name: string
      x: string
      y: string
      place_url?: string
    }>, status: unknown) => void,
    options?: { size?: number; sort?: unknown }
  ): void
}

interface KakaoGeocoder {
  coord2Address(
    lng: number,
    lat: number,
    callback: (result: Array<{
      address?: { address_name?: string }
    }>, status: unknown) => void
  ): void
}

declare global {
  interface Window {
    kakao: {
      maps: {
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        Map: new (container: HTMLElement, options: {
          center: KakaoLatLng
          level: number
        }) => KakaoMap
        Marker: new (options: {
          position: KakaoLatLng
          image?: KakaoMarkerImage
        }) => KakaoMarker
        InfoWindow: new (options: {
          content: string
          position?: KakaoLatLng
        }) => unknown
        event: {
          addListener: (target: unknown, type: string, handler: (...args: unknown[]) => void) => void
          removeListener: (target: unknown, type: string, handler: (...args: unknown[]) => void) => void
        }
        services: {
          Places: new () => KakaoPlaces
          Geocoder: new () => KakaoGeocoder
          Status: { OK: unknown }
          SortBy: { DISTANCE: unknown }
        }
        MarkerImage: new (src: string, size: KakaoSize, options?: unknown) => KakaoMarkerImage
        Size: new (width: number, height: number) => KakaoSize
        load: (callback: () => void) => void
      }
    }
  }
}

export {}