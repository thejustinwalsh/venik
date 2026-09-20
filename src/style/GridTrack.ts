// Port of yoga-cpp/yoga/style/GridTrack.h

import { StyleSizeLength } from "./StyleSizeLength.ts";

// https://www.w3.org/TR/css-grid-1/#typedef-track-size
export class GridTrackSize {
  minSizingFunction: StyleSizeLength;
  maxSizingFunction: StyleSizeLength;

  // These are used in the grid layout algorithm when distributing spaces among
  // tracks
  // TODO: maybe move them to TrackSizing since these are track states
  baseSize: number = 0;
  growthLimit: number = 0;
  infinitelyGrowable: boolean = false;

  /** A default constructed C++ `GridTrackSize{}` has undefined sizing functions. */
  constructor(minSizingFunction?: StyleSizeLength, maxSizingFunction?: StyleSizeLength) {
    this.minSizingFunction = minSizingFunction ?? StyleSizeLength.undefined();
    this.maxSizingFunction = maxSizingFunction ?? StyleSizeLength.undefined();
  }

  // Static factory methods for common cases

  /** `GridTrackSize::auto_()` */
  static auto(): GridTrackSize {
    return new GridTrackSize(StyleSizeLength.ofAuto(), StyleSizeLength.ofAuto());
  }

  static length(points: number): GridTrackSize {
    const len = StyleSizeLength.points(points);
    return new GridTrackSize(len, len);
  }

  /** Flex sizing function is always a max sizing function. */
  static fr(fraction: number): GridTrackSize {
    return new GridTrackSize(StyleSizeLength.ofAuto(), StyleSizeLength.stretch(fraction));
  }

  static percent(percentage: number): GridTrackSize {
    return new GridTrackSize(
      StyleSizeLength.percent(percentage),
      StyleSizeLength.percent(percentage),
    );
  }

  static minmax(min: StyleSizeLength, max: StyleSizeLength): GridTrackSize {
    return new GridTrackSize(min, max);
  }

  /** C++ defaulted `operator==`: compares every member. */
  equals(other: GridTrackSize): boolean {
    return (
      this.minSizingFunction.equals(other.minSizingFunction) &&
      this.maxSizingFunction.equals(other.maxSizingFunction) &&
      this.baseSize === other.baseSize &&
      this.growthLimit === other.growthLimit &&
      this.infinitelyGrowable === other.infinitelyGrowable
    );
  }

  /** C++ copy construction. */
  clone(): GridTrackSize {
    const copy = new GridTrackSize(this.minSizingFunction, this.maxSizingFunction);
    copy.baseSize = this.baseSize;
    copy.growthLimit = this.growthLimit;
    copy.infinitelyGrowable = this.infinitelyGrowable;
    return copy;
  }
}

/** Grid track list for grid-template-rows/columns properties. */
export type GridTrackList = GridTrackSize[];
