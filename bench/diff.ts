import { run, bench, summary, boxplot } from "mitata";
import { diff, type UltraPatchTypes } from "../dist/index.js";
import microdiff from "microdiff";
import jsonpatch from "fast-json-patch";
import * as jsondiffts from "json-diff-ts";
import rfc6902 from "rfc6902";
import { dataSets } from "./data.ts";

for (const bundle of dataSets) {
  boxplot(() => {
    summary(() => {
      bench(`ultrapatch: ${bundle.name}`, function* () {
        yield () => diff(bundle.origin, bundle.destination);
      });
      bench(`fast-json-patch: ${bundle.name}`, function* () {
        yield () => jsonpatch.compare(bundle.origin!, bundle.destination!);
      });
      bench(`microdiff: ${bundle.name}`, function* () {
        yield () =>
          microdiff(
            bundle.origin as UltraPatchTypes.DiffableCollection,
            bundle.destination as UltraPatchTypes.DiffableCollection,
            { cyclesFix: false },
          );
      });
      bench(`jsondiffts: ${bundle.name}`, function* () {
        yield () => jsondiffts.diff(bundle.origin, bundle.destination);
      });
      if (bundle.id !== "randomgame") {
        // randomgame crashes with rfc6902 on my machine
        bench(`rfc6902: ${bundle.name}`, function* () {
          yield () => rfc6902.createPatch(bundle.origin, bundle.destination);
        });
      }
    });
  });
}

await run();
