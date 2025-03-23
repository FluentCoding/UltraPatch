import { JSONPatchTypes } from "./util/jsonpatch";
import type { UltraPatchTypes } from "./util/types";
import { UltraPatchUtil } from "./util/util";

export * from "./util/types";

// reference https://jsonpatch.com/
/**
 * Returns an array of JSONPatch operations that allow you to replicate the changes required to make `origin` equal to `destination`.
 *
 * **Disclaimer:** Both `origin` and `destination` are only allowed to contain `string | number | bigint | boolean | undefined | null | Record<string, ...> | Array<...>`
 * where ... is one of the mentioned types. Also make sure that both `origin` and `destination` don't include ANY circular references.
 *
 * @param origin Initial state
 * @param destination Desired result
 * @returns List of operations (empty if no operations required)
 */
export function diff(
  origin: UltraPatchTypes.Diffable,
  destination: UltraPatchTypes.Diffable
): JSONPatchTypes.Operation[] {
  if (origin === destination) return [];

  const operations: JSONPatchTypes.Operation[] = [];
  const stack: {
    o: UltraPatchTypes.Diffable;
    d: UltraPatchTypes.Diffable;
    p: string;
  }[] = new Array(UltraPatchUtil.STACK_SIZE);
  stack[0] = { o: origin, d: destination, p: "" };
  let path = "",
    originIsArr = false,
    destIsArr = false,
    originLength = 0,
    destLength = 0,
    combinedLength = 0, // probably faster than Math.min(originLength, destLength)
    stackIndex = 0;

  while (stackIndex >= 0) {
    const { o: origin, d: destination, p: parentPath } = stack[stackIndex--]!;
    if (origin === destination) continue;

    (originIsArr = Array.isArray(origin)),
      (destIsArr = Array.isArray(destination));
    if (originIsArr && destIsArr) {
      (originLength = (origin as []).length),
        (destLength = (destination as []).length),
        (combinedLength = originLength);
      if (destLength === originLength) {
      } else if (destLength > originLength) {
        for (let i = destLength; i-- !== originLength; ) {
          operations.push({
            op: "add",
            path: parentPath + "/" + i,
            value: (destination as [])[i],
          });
        }
      } else {
        combinedLength = destLength;
        for (let i = originLength; i-- !== destLength; ) {
          operations.push({
            op: "remove",
            path: parentPath + "/" + i,
          });
        }
      }

      for (let i = combinedLength; i-- !== 0; ) {
        if ((origin as [])[i] !== (destination as [])[i]) {
          const originValue = (origin as [])[i],
            destinationValue = (destination as [])[i];
          path = parentPath + "/" + i;
          if (
            typeof originValue === "object" &&
            typeof destinationValue === "object"
          ) {
            if (++stackIndex === stack.length) stack.length *= 2;
            stack[stackIndex] = {
              o: originValue,
              d: destinationValue,
              p: path,
            };
          } else {
            operations.push({
              op: "replace",
              path,
              value: destinationValue,
            });
          }
        }
      }
    } else if (
      originIsArr === destIsArr && // both would have to be false since one of them is false
      origin !== null &&
      typeof origin === "object" &&
      destination !== null &&
      typeof destination === "object"
    ) {
      for (const key in origin) {
        if (UltraPatchUtil.hasOwnProperty(destination, key)) {
          if ((origin as any)[key] !== (destination as any)[key]) {
            const originValue = (origin as any)[key],
              destinationValue = (destination as any)[key];
            path = parentPath + "/" + UltraPatchUtil.escapePathComponent(key);
            if (
              typeof originValue === "object" &&
              typeof destinationValue === "object"
            ) {
              if (++stackIndex === stack.length) stack.length *= 2;
              stack[stackIndex] = {
                o: originValue,
                d: destinationValue,
                p: path,
              };
            } else {
              operations.push({
                op: "replace",
                path,
                value: destinationValue,
              });
            }
          }
        } else {
          operations.push({
            op: "remove",
            path: parentPath + "/" + UltraPatchUtil.escapePathComponent(key),
          });
        }
      }

      for (const key in destination) {
        if (!UltraPatchUtil.hasOwnProperty(origin, key)) {
          operations.push({
            op: "add",
            path: parentPath + "/" + key,
            value: (destination as any)[key],
          });
        }
      }
    } else {
      operations.push({
        op: "replace",
        path: parentPath,
        value: destination,
      });
    }
  }

  return operations;
}

/**
 * Applies the supplied list of JSONPatch operations onto `target` **(in-place, no cloning)** and returns the result.
 * If none of the operations modify the root (`operation.path == ""`), you can safely assume that the returned value matches your first argument's reference.
 *
 * **Disclaimer:** This function will never check for validity of `operations`, like faulty paths, the only security mechanism implemented in the
 * entire library is supporting the [test](https://datatracker.ietf.org/doc/html/rfc6902#section-4.6) JSONPatch operation. Make sure that you know what you're doing.
 *
 * @param target Initial state
 * @param operations List of JSONPatch operations
 * @returns Desired result
 */
export function patch(
  target: UltraPatchTypes.Diffable,
  operations: JSONPatchTypes.Operation[]
): UltraPatchTypes.Diffable {
  let result: UltraPatchTypes.Diffable = target;
  for (const operation of operations) {
    if (operation.path === "") {
      switch (operation.op) {
        case "add":
        case "replace":
          result = operation.value;
          break;
        case "remove":
          target = null;
          break;
        case "move":
        case "copy":
          result = UltraPatchUtil.accessPath(
            result as UltraPatchTypes.DiffableCollection,
            operation.from
          );
          break;
        case "test":
          if (!UltraPatchUtil.isEqual(result, operation.value))
            throw new JSONPatchTypes.JSONPatchTestError(
              "",
              operation.value,
              result
            );
          break;
      }
    } else {
      switch (operation.op) {
        case "add": {
          let parent = result as UltraPatchTypes.DiffableCollection;
          const pathSegments = UltraPatchUtil.unescapedPathSegments(
            operation.path
          );
          const last = pathSegments.length - 1;

          for (let i = 1; i < last; i++) {
            parent = parent[
              pathSegments[i] as keyof typeof parent
            ] as UltraPatchTypes.DiffableCollection;
          }

          const lastPointer = pathSegments[last]!;
          if (Array.isArray(parent)) {
            if (lastPointer === "-") {
              parent.push(operation.value);
            } else {
              parent.splice(parseInt(lastPointer), 0, operation.value);
            }
          } else {
            (parent[
              pathSegments[last] as keyof typeof parent
            ] as UltraPatchTypes.Diffable) = operation.value;
          }
          break;
        }
        case "replace": {
          let parent = result as UltraPatchTypes.DiffableCollection;
          const pathSegments = UltraPatchUtil.unescapedPathSegments(
            operation.path
          );
          const last = pathSegments.length - 1;

          for (let i = 1; i < last; i++) {
            parent = parent[
              pathSegments[i] as keyof typeof parent
            ] as UltraPatchTypes.DiffableCollection;
          }

          (parent[
            pathSegments[last] as keyof typeof parent
          ] as UltraPatchTypes.Diffable) = operation.value;
          break;
        }
        case "remove": {
          let parent = result as UltraPatchTypes.DiffableCollection;
          const pathSegments = UltraPatchUtil.unescapedPathSegments(
            operation.path
          );
          const last = pathSegments.length - 1;

          for (let i = 1; i < last; i++) {
            parent = parent[
              pathSegments[i] as keyof typeof parent
            ] as UltraPatchTypes.DiffableCollection;
          }

          const lastPointer = pathSegments[last]!;
          if (Array.isArray(parent)) {
            parent.splice(parseInt(lastPointer), 1);
          } else {
            delete parent[lastPointer];
          }
          break;
        }
        case "move": {
          if (operation.from === operation.path) break;

          let fromValue: UltraPatchTypes.Diffable;
          {
            let parent = result as UltraPatchTypes.DiffableCollection;
            const pathSegments = UltraPatchUtil.unescapedPathSegments(
              operation.from
            );
            const last = pathSegments.length - 1;

            for (let i = 1; i < last; i++) {
              parent = parent[
                pathSegments[i] as keyof typeof parent
              ] as UltraPatchTypes.DiffableCollection;
            }

            if (Array.isArray(parent)) {
              const idx = parseInt(pathSegments[last]!);
              fromValue = parent[idx];
              parent.splice(idx, 1);
            } else {
              fromValue = parent[pathSegments[last]!];
              delete parent[pathSegments[last]!];
            }
          }
          {
            let parent = result as UltraPatchTypes.DiffableCollection;
            const pathSegments = UltraPatchUtil.unescapedPathSegments(
              operation.path
            );
            const last = pathSegments.length - 1;

            for (let i = 1; i < last; i++) {
              parent = parent[
                pathSegments[i] as keyof typeof parent
              ] as UltraPatchTypes.DiffableCollection;
            }

            (parent[
              pathSegments[last] as keyof typeof parent
            ] as UltraPatchTypes.Diffable) = fromValue;
          }
          break;
        }
        case "copy": {
          if (operation.from === operation.path) break;

          let fromValue: UltraPatchTypes.Diffable;
          {
            let parent = result as UltraPatchTypes.DiffableCollection;
            const pathSegments = UltraPatchUtil.unescapedPathSegments(
              operation.from
            );
            const last = pathSegments.length - 1;

            for (let i = 1; i < last; i++) {
              parent = parent[
                pathSegments[i] as keyof typeof parent
              ] as UltraPatchTypes.DiffableCollection;
            }

            fromValue = parent[
              pathSegments[last] as keyof typeof parent
            ] as UltraPatchTypes.Diffable;
          }
          {
            let parent = result as UltraPatchTypes.DiffableCollection;
            const pathSegments = UltraPatchUtil.unescapedPathSegments(
              operation.path
            );
            const last = pathSegments.length - 1;

            for (let i = 1; i < last; i++) {
              parent = parent[
                pathSegments[i] as keyof typeof parent
              ] as UltraPatchTypes.DiffableCollection;
            }

            (parent[
              pathSegments[last] as keyof typeof parent
            ] as UltraPatchTypes.Diffable) =
              typeof fromValue === "object"
                ? structuredClone(fromValue)
                : fromValue;
          }
          break;
        }
        case "test":
          const actualValue = UltraPatchUtil.accessPath(
            result as UltraPatchTypes.DiffableCollection,
            operation.path
          );
          if (!UltraPatchUtil.isEqual(actualValue, operation.value))
            throw new JSONPatchTypes.JSONPatchTestError(
              operation.path,
              operation.value,
              actualValue
            );
          break;
      }
    }
  }
  return result;
}
