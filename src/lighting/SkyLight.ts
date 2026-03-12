import type { Texture } from "three";
import { HemisphereLight, RGBAFormat } from "three";

const RGBA_CHANNEL_COUNT = 4;
const RGB_CHANNEL_COUNT = 3;

/** ITU-R BT.709 */
const LUMINANCE_R = 0.2126;
/** ITU-R BT.709 */
const LUMINANCE_G = 0.7152;
/** ITU-R BT.709 */
const LUMINANCE_B = 0.0722;

const SKY_SAMPLE_THRESHOLD = 0.25;
const GROUND_SAMPLE_THRESHOLD = 0.75;

export interface SkyLightOptions {
  /** Top N pixels by luminance. Default: 100. */
  skySampleCount?: number;
  /** Bottom N pixels by luminance. Default: 100. */
  groundSampleCount?: number;
  /** Default: true. */
  applyGamma?: boolean;
  /** Default: 2.2. */
  gamma?: number;
}

interface Pixel {
  r: number;
  g: number;
  b: number;
  lum: number;
}

/**
 * Hemisphere light with HDR environment map support for automatic sky/ground color extraction.
 */
export class SkyLight extends HemisphereLight {
  /** @param texture - Must have image data. */
  public setColorsFromHDRTexture(texture: Texture, options: SkyLightOptions = {}): void {
    const {
      skySampleCount = 100,
      groundSampleCount = 100,
      applyGamma = true,
      gamma = 2.2,
    } = options;

    const data = texture.image.data as Float32Array | Uint8Array;
    const width = texture.image.width as number;
    const height = texture.image.height as number;
    const step = texture.format === RGBAFormat ? RGBA_CHANNEL_COUNT : RGB_CHANNEL_COUNT;

    const skyPixels: Pixel[] = [];
    const groundPixels: Pixel[] = [];

    for (let i = 0; i < data.length; i += step) {
      const pixelIndex = i / step;
      const y = Math.floor(pixelIndex / width);
      const v = y / height;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = LUMINANCE_R * r + LUMINANCE_G * g + LUMINANCE_B * b;

      const pixel: Pixel = { r, g, b, lum: luminance };

      if (v < SKY_SAMPLE_THRESHOLD) {
        this.insertSorted(skyPixels, pixel, skySampleCount, true);
      } else if (v > GROUND_SAMPLE_THRESHOLD) {
        this.insertSorted(groundPixels, pixel, groundSampleCount, false);
      }
    }

    const skyColor = this.averagePixels(skyPixels);
    const groundColor = this.averagePixels(groundPixels);

    if (applyGamma) {
      const invGamma = 1 / gamma;
      skyColor.r = Math.pow(skyColor.r, invGamma);
      skyColor.g = Math.pow(skyColor.g, invGamma);
      skyColor.b = Math.pow(skyColor.b, invGamma);
      groundColor.r = Math.pow(groundColor.r, invGamma);
      groundColor.g = Math.pow(groundColor.g, invGamma);
      groundColor.b = Math.pow(groundColor.b, invGamma);
    }

    // Normalize HDR values to [0, 1] range
    const maxSky = Math.max(skyColor.r, skyColor.g, skyColor.b, 1);
    const maxGround = Math.max(groundColor.r, groundColor.g, groundColor.b, 1);

    this.color.setRGB(skyColor.r / maxSky, skyColor.g / maxSky, skyColor.b / maxSky);
    this.groundColor.setRGB(
      groundColor.r / maxGround,
      groundColor.g / maxGround,
      groundColor.b / maxGround,
    );
  }

  private insertSorted(
    array: Pixel[],
    pixel: Pixel,
    maxSize: number,
    sortDescending: boolean,
  ): void {
    if (array.length < maxSize) {
      array.push(pixel);
      array.sort((a, b) => (sortDescending ? b.lum - a.lum : a.lum - b.lum));
    } else {
      const threshold = array[array.length - 1].lum;
      const shouldInsert = sortDescending ? pixel.lum > threshold : pixel.lum < threshold;

      if (shouldInsert) {
        array.pop();
        array.push(pixel);
        array.sort((a, b) => (sortDescending ? b.lum - a.lum : a.lum - b.lum));
      }
    }
  }

  private averagePixels(pixels: Pixel[]): { r: number; g: number; b: number } {
    if (pixels.length === 0) {
      return { r: 0.5, g: 0.5, b: 0.5 };
    }

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;

    for (const pixel of pixels) {
      totalR += pixel.r;
      totalG += pixel.g;
      totalB += pixel.b;
    }

    return {
      r: totalR / pixels.length,
      g: totalG / pixels.length,
      b: totalB / pixels.length,
    };
  }
}
