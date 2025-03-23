import { describe, expect, test } from "bun:test";
import * as UltraPatch from "../src";
import jsonpatchtests from "./tests.json";
import type { JSONPatchTypes } from "../src/util/jsonpatch";

const PATCH_DIFF_DEBUG_OUTPUT = false;

describe("diff", () => {
  test("primitives", () => {
    expect(UltraPatch.diff(0, 1)).toStrictEqual([
      {
        op: "replace",
        path: "",
        value: 1,
      },
    ]);
    expect(UltraPatch.diff(null, "undefined")).toStrictEqual([
      {
        op: "replace",
        path: "",
        value: "undefined",
      },
    ]);
    expect(UltraPatch.diff({}, { a: BigInt(5) })).toStrictEqual([
      {
        op: "add",
        path: "/a",
        value: BigInt(5),
      },
    ]);
  });
  test("array", () => {
    expect(UltraPatch.diff(["a"], ["a", "b"])).toStrictEqual([
      { op: "add", path: "/1", value: "b" },
    ]);
    expect(UltraPatch.diff(["a", "c"], ["b", "c", "a", 5])).toStrictEqual([
      {
        op: "add",
        path: "/3",
        value: 5,
      },
      {
        op: "add",
        path: "/2",
        value: "a",
      },
      {
        op: "replace",
        path: "/0",
        value: "b",
      },
    ]);
  });
  test("object", () => {
    expect(UltraPatch.diff({ a: 5 }, { a: 5, b: "2" })).toStrictEqual([
      { op: "add", path: "/b", value: "2" },
    ]);
    expect(UltraPatch.diff({ a: 5 }, { a: "5" })).toStrictEqual([
      {
        op: "replace",
        path: "/a",
        value: "5",
      },
    ]);
    expect(
      UltraPatch.diff({ a: { b: 3, c: 4 } }, { a: { b: 5, c: 4 } }),
    ).toStrictEqual([
      {
        op: "replace",
        path: "/a/b",
        value: 5,
      },
    ]);
  });
});
describe("patch and diff", () => {
  test("simple patch", () => {
    expect(
      UltraPatch.patch({ a: 1 }, [{ op: "add", path: "/b", value: 2 }]),
    ).toStrictEqual({ a: 1, b: 2 });
    expect(
      UltraPatch.patch({ a: 1 }, [{ op: "add", path: "/b", value: BigInt(3) }]),
    ).toStrictEqual({ a: 1, b: BigInt(3) });
    expect(
      UltraPatch.patch({ a: [5, 3, { c: 2 }] }, [
        { op: "replace", path: "/a/2/c", value: 4 },
        { op: "remove", path: "/a/1" },
        { op: "add", path: "/a/0", value: 1 },
      ]),
    ).toStrictEqual({ a: [1, 5, { c: 4 }] });
  });
  test("slash path", () => {
    expect(
      UltraPatch.patch(
        { "/a": { "~b": "c" } },
        UltraPatch.diff({ "/a": { "~b": "c" } }, { "~a": { "/b": "c" } }),
      ),
    ).toStrictEqual({ "~a": { "/b": "c" } });
  });
  test.each(jsonpatchtests)(
    "json-patch-tests: %s",
    // @ts-ignore
    (comment, doc, patch, expected) => {
      // first, we test expected patch behavior
      expect(
        UltraPatch.patch(
          structuredClone(doc),
          patch as JSONPatchTypes.Operation[],
        ),
      ).toEqual(expected);

      if (PATCH_DIFF_DEBUG_OUTPUT) {
        console.table({
          "Origin:": [doc],
          "Given patch:": [patch],
          "Our patch:": [UltraPatch.diff(doc, expected)],
          "Destination:": [expected],
        });
      }

      // second, we test our diff algorithm by patching the origin with our own diff of destination to origin and compare it to the expected destination
      expect(UltraPatch.patch(doc, UltraPatch.diff(doc, expected))).toEqual(
        expected,
      );
    },
  );
});
