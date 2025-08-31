declare global {
  interface Window {
    kakao: {
      maps: {
        LatLng: new (lat: number, lng: number) => any
        Map: new (container: HTMLElement, options: any) => any
        Marker: new (options: any) => any
        InfoWindow: new (options: any) => any
        event: {
          addListener: (target: any, type: string, handler: Function) => void
          removeListener: (target: any, type: string, handler: Function) => void
        }
        services: {
          Places: new () => any
          Geocoder: new () => any
        }
        MarkerImage: new (src: string, size: any, options?: any) => any
        Size: new (width: number, height: number) => any
      }
    }
  }
}

export {}