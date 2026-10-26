declare module 'gifshot' {
  interface GifOptions {
    video?: string[] | HTMLVideoElement | string;
    images?: (string | HTMLCanvasElement | HTMLImageElement)[];
    gifWidth?: number;
    gifHeight?: number;
    interval?: number;
    numFrames?: number;
    frameDuration?: number;
    sampleInterval?: number;
    numWorkers?: number;
    offset?: number;
    progressCallback?: (captureProgress: number) => void;
    completeCallback?: () => void;
  }

  interface GifResponse {
    error: boolean;
    errorCode?: string;
    errorMsg?: string;
    image: string; // base64 data url
  }

  export function createGIF(
    options: GifOptions,
    callback: (obj: GifResponse) => void
  ): void;

  export function isSupported(): boolean;
  export function isVideoSupported(): boolean;
}
