import { run, bench, summary, boxplot } from "mitata";
import * as UltraPatch from "../dist/index.js";
import jiff from "jiff";
import jsonpatch from "fast-json-patch";
import { applyPatch } from "json-joy/lib/json-patch";
import rfc6902 from "rfc6902";
import { dataSets } from "./data.js";

for (const bundle of dataSets) {
  boxplot(() => {
    summary(async () => {
      // in each benchmark, we clone the origin object (doesn't contribute to measured compute time) just in case the patch functions are modifiying it in-place
      bench(`ultrapatch: ${bundle.name}`, function* () {
        yield {
          [0]() {
            return structuredClone(bundle.origin);
          },
          bench(origin: any) {
            UltraPatch.patch(origin, bundle.diff);
          },
        };
      });
      bench(`fast-json-patch: ${bundle.name}`, function* () {
        yield {
          [0]() {
            return structuredClone(bundle.origin);
          },
          bench(origin: any) {
            jsonpatch.applyPatch(origin, bundle.diff);
          },
        };
      });
      bench(`json-joy: ${bundle.name}`, function* () {
        yield {
          [0]() {
            return structuredClone(bundle.origin);
          },
          bench(origin: any) {
            applyPatch(origin, bundle.diff, { mutate: true });
          },
        };
      });
      bench(`jiff: ${bundle.name}`, function* () {
        yield {
          [0]() {
            return structuredClone(bundle.origin);
          },
          [1]() {
            // jiff doesn't support 'undefined'
            return bundle.diff.map((patch) =>
              (patch.op === "add" || patch.op === "replace") &&
              patch.value === undefined
                ? { ...patch, value: null }
                : patch,
            );
          },
          bench(origin: any, patch: any) {
            jiff.patch(patch, origin);
          },
        };
      });
      bench(`rfc6902: ${bundle.name}`, function* () {
        yield {
          [0]() {
            return structuredClone(bundle.origin);
          },
          bench(origin: any) {
            rfc6902.applyPatch(origin, bundle.diff);
          },
        };
      });
    });
  });
}

await run();
