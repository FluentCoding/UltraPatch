import type { UltraPatchTypes } from "./types";

export namespace UltraPatchUtil {
  export const STACK_SIZE = 16; // used to avoid recursion in diffing

  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  export function hasOwnProperty(obj: any, key: any) {
    return _hasOwnProperty.call(obj, key);
  }

  export function accessPath(
    value: UltraPatchTypes.DiffableCollection,
    path: string,
  ) {
    if (path === "") return value;

    const pathSegments = unescapedPathSegments(path);
    for (let i = 1; i < pathSegments.length; i++) {
      value = value[
        pathSegments[i] as keyof typeof value
      ] as UltraPatchTypes.DiffableCollection;
    }
    return value;
  }

  // heavily inspired (and stripped down version) by https://github.com/react-hookz/deep-equal/blob/master/src/index.ts
  export const isEqual = (a: any, b: any): boolean => {
    if (a === b) {
      return true;
    }

    if (
      typeof a === "object" &&
      typeof b === "object" &&
      Boolean(a) &&
      Boolean(b)
    ) {
      if (Array.isArray(a)) {
        if (a.length !== b.length) {
          return false;
        }

        for (let i = a.length; i-- !== 0; ) {
          if (!isEqual(a[i], b[i])) {
            return false;
          }
        }

        return true;
      }

      const aKeys = Object.keys(a);
      for (const key of aKeys) {
        if (!hasOwnProperty(b, key) || !isEqual(a[key], b[key])) {
          return false;
        }
      }

      return Object.keys(b).length === aKeys.length;
    }

    return false;
  };

  export function escapePathComponent(path: string): string {
    if (path.indexOf("/") === -1 && path.indexOf("~") === -1) return path;
    return path.replace(/~/g, "~0").replace(/\//g, "~1");
  }

  export function unescapePathComponent(path: string): string {
    return path.replace(/~1/g, "/").replace(/~0/g, "~");
  }

  export function unescapedPathSegments(path: string) {
    const segments = path.split("/");
    for (let i = 1; i < segments.length; i++) {
      if (segments[i]!.indexOf("~") !== -1)
        segments[i] = unescapePathComponent(segments[i]!);
    }
    return segments;
  }
}
