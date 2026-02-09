<h1 align="center">
  <picture>
      <source height="80" media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/d911d140-2cbd-4965-b529-69ce481c2f56">
      <img height="80" src="https://github.com/user-attachments/assets/d911d140-2cbd-4965-b529-69ce481c2f56">
  </picture>

![npm version](https://img.shields.io/npm/v/ultrapatch)
![license](https://img.shields.io/npm/l/ultrapatch)

</h1>

- 100% coverage of [JSON Patch Tests](https://github.com/json-patch/json-patch-tests/blob/master/tests.json) (excluding faulty ones, see below)
- Runs in all modern JavaScript runtimes like Bun, Node.JS, Deno but also Browsers
- TypeScript & CommonJS support, zero dependencies and extremely lightweight

---

- [Usage](#usage)
- [Benchmarks](#benchmarks)
- [Testing & Contributing](#testing--contributing)

<br>

A very fast JSONPatch library that is capable of generating diffs and patching existing objects with compatible diffs. The implementation is naive, meaning that it does not handle edge cases like...

- circular references
- using invalid diffs when patching
- using non-supported types, this library only supports **`string | number | bigint | boolean | undefined | null`** or nested objects/arrays with those types, the library intentionally does not try to cover `Set | RegExp | Symbol`, class instances, ...

When doing one of those things wrong, in best case, you will (sometimes) get cryptic errors when patching with invalid diffs, and in worst case you will be stuck in an infinite loop due to a circular reference when diffing.

If you want to diff/patch internally or, in a network environment, synchronize state from an authoritative server to clients whilst leveraging a technology like WebSockets, where you can **reliably** send **in-order** patches of state, then this library is for you. You can also feel free to generate diffs with any other library of your choice (as long as it complies with the JSONPatch standards) and only leverage the patch functionality that this library provides, or do the reverse.

## Usage

Install this library with the package manager of your choice:

```sh
bun add ultrapatch      # Bun
npm i ultrapatch        # Node
deno add npm:ultrapatch # Deno
```

... then simply use the two provided methods like this:

```ts
import * as UltraPatch from "ultrapatch";

const original = { a: 1, b: [1, 2] };
const modified = { a: 2, b: [1, 2, 3] };

// returns the list of changes in JSONPatch format
const diff = UltraPatch.diff(original, modified);

// modifies the first argument in-place to apply the changes in the second argument and returns the result (reference to first argument or entirely new object in case you modify at root-level)
const desired = UltraPatch.patch(original, diff);

// desired === { a: 2, b: [1, 2, 3] } === modified
```

## Benchmarks

Due to the given constraints that I have set for UltraPatch, this library is able to outperform the currently fastest JSONPatch implementations by orders of magnitude (in best case) in both diffing and patching. This comes at the price of only supporting basic datatypes, not verifying validity of diffs when patching and risking infinite loops if working with objects that include circular references.

### Samples & Setup

For reference, [here](https://github.com/FluentCoding/UltraPatch/blob/main/bench/data.ts#L36-L342) are all the samples that have been used in the benchmarking process.<br>
Each `OriginDiffDestBundle` represents the original object, the diff from original <-> modified and the modified object.

To benchmark the diffing, we diff the original from the modified object of each sample.<br>
For the patching, we patch the original with the provided diff of the sample (that has been precomputed).

_Disclaimer: I have removed the jiff library from the diff benchmarks due to wrong results that artificially resulted in fast times because jiff simply didn't diff at all and rather outputted "add" operations for the entire destination object._

| Test name                                                                        | Diff operations length |
| -------------------------------------------------------------------------------- | ---------------------- |
| Simple                                                                           | 3                      |
| Complicated                                                                      | 14                     |
| Random 1000 players game, x/y positions moving (big flat array)                  | 2000                   |
| 10x NestJS package.json, removing scripts and adding 2 fake dependencies to each | 30                     |

Tested on:

```yml
clk: ~2.97 GHz
cpu: AMD Ryzen 5 5600X 6-Core Processor
runtime: bun 1.3.10 (x64-win32)
```

### Diff Benchmarks

| Simple          | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 71.36 ns/iter       | 4.80 b                      |
| fast-json-patch | 330.08 ns/iter      | 1.47 b                      |
| microdiff       | 544.58 ns/iter      | 1.19 b                      |
| jsondiffts      | 2.28 µs/iter        | 68.14 b                     |
| rfc6902         | 10.77 µs/iter       | 40.21 b                     |

```
summary
  ultrapatch
   4.63x faster than fast-json-patch
   7.63x faster than microdiff
   31.93x faster than jsondiffts
   150.92x faster than rfc6902
```

---

| Complicated     | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 664.93 ns/iter      | 7.22 b                      |
| fast-json-patch | 1.91 µs/iter        | 17.70 b                     |
| microdiff       | 4.80 µs/iter        | 44.11 b                     |
| jsondiffts      | 17.23 µs/iter       | 593.20 kb                   |
| rfc6902         | 28.04 µs/iter       | 119.03 b                    |

```
summary
  ultrapatch
   2.87x faster than fast-json-patch
   7.22x faster than microdiff
   25.91x faster than jsondiffts
   42.16x faster than rfc6902
```

---

_Disclaimer: rfc6902 crashed in the following test so its excluded_

| randomgame      | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 140.82 µs/iter      | 12.19 kb                    |
| fast-json-patch | 232.78 µs/iter      | 3.93 kb                     |
| microdiff       | 618.15 µs/iter      | 37.75 kb                    |
| jsondiffts      | 3.77 ms/iter        | 92.86 kb                    |

```
summary
  ultrapatch
   1.65x faster than fast-json-patch
   4.39x faster than microdiff
   26.76x faster than jsondiffts
```

---

| bignested       | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 142.85 µs/iter      | 8.87 kb                     |
| fast-json-patch | 155.90 µs/iter      | 5.76 kb                     |
| microdiff       | 292.43 µs/iter      | 19.31 kb                    |
| jsondiffts      | 1.58 ms/iter        | 124.73 kb                   |
| rfc6902         | 16.19 ms/iter       | 514.50 kb                   |

```
summary
  ultrapatch
   1.09x faster than fast-json-patch
   2.05x faster than microdiff
   11.07x faster than jsondiffts
   113.32x faster than rfc6902
```

---

In all given benchmarks, UltraPatch outperforms the other major JSONPatch libraries whilst keeping memory usage at a stable low.

### Patch Benchmarks

| Simple          | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 263.14 ns/iter      | 13.73 b                     |
| fast-json-patch | 453.39 ns/iter      | 9.01 b                      |
| json-joy        | 447.76 ns/iter      | 10.26 b                     |
| jiff            | 374.94 ns/iter      | 16.28 b                     |
| rfc6902         | 983.02 ns/iter      | 4.78 b                      |

```summary
summary
  ultrapatch
   1.42x faster than jiff
   1.7x faster than json-joy
   1.72x faster than fast-json-patch
   3.74x faster than rfc6902
```

---

| Complicated     | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 1.34 µs/iter        | 87.29 b                     |
| fast-json-patch | 2.07 µs/iter        | 71.29 b                     |
| json-joy        | 2.72 µs/iter        | 197.80 b                    |
| jiff            | 4.00 µs/iter        | 242.37 b                    |
| rfc6902         | 5.76 µs/iter        | 241.38 b                    |

```
summary
  ultrapatch
   1.54x faster than fast-json-patch
   2.02x faster than json-joy
   2.98x faster than jiff
   4.29x faster than rfc6902
```

---

| randomgame      | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 298.52 µs/iter      | 707.97 b                    |
| fast-json-patch | 421.25 µs/iter      | 28.50 kb                    |
| json-joy        | 492.67 µs/iter      | 26.44 kb                    |
| jiff            | 610.00 µs/iter      | 2.06 kb                     |
| rfc6902         | 916.78 µs/iter      | 51.64 kb                    |

```summary
summary
  ultrapatch
   1.41x faster than fast-json-patch
   1.65x faster than json-joy
   2.04x faster than jiff
   3.07x faster than rfc6902
```

---

| bignested       | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 5.91 µs/iter        | 300.70 b                    |
| fast-json-patch | 7.54 µs/iter        | 744.19 b                    |
| json-joy        | 9.84 µs/iter        | 1.61 kb                     |
| jiff            | 109.28 µs/iter      | 2.09 kb                     |
| rfc6902         | 17.43 µs/iter       | 2.24 kb                     |

```
summary
  ultrapatch
   1.28x faster than fast-json-patch
   1.67x faster than json-joy
   2.95x faster than rfc6902
   18.5x faster than jiff
```

---

UltraPatch also has the upper hand in every patching benchmark.

## Testing & Contributing

Feel free to report bugs or issue suggestions for this project! Although supporting more types beyond the aforementioned primitive types is probably outside of the scope of what this project tries to achieve, I would be more than willing to add more in case people want them. Also any findings for further optimizations would be greatly appreciated!

To test and build the library, you need [Bun](https://bun.sh), `bun run build` builds the JS files and definition types inside `/dist` which is also the version of UltraPatch that is linked in the benchmarks inside `/bench`.

With `bun test`, you can see if your version passes through all tests that I have used when releasing the library. To run the benchmarks, use `bun bench:diff` and `bun bench:patch` (or the node equivalents with `npm run node:bench:...`).
