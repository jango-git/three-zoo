import type { Texture } from "three";
import { DataUtils, HalfFloatType } from "three";

/** Image data of an HDR texture as loaded by `RGBELoader` or built with `DataTexture`. */
export interface HDRImage {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

/** Reads one channel of HDR image data by its index in the data array, as a linear value. */
export type HDRChannelReader = (index: number) => number;

/** `Texture.image` is typed `any` before three 0.181 and `unknown` from it on. */
export function getHDRImage(texture: Texture): HDRImage {
  return texture.image as HDRImage;
}

/** Half float data holds raw 16-bit codes and is decoded; float data is read as is. */
export function createHDRChannelReader(texture: Texture): HDRChannelReader {
  const { data } = getHDRImage(texture);
  if (texture.type === HalfFloatType) {
    return (index) => DataUtils.fromHalfFloat(data[index]);
  }
  return (index) => data[index];
}
