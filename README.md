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

| Test name                                                                        | Diff operations length |
| -------------------------------------------------------------------------------- | ---------------------- |
| Simple                                                                           | 3                      |
| Complicated                                                                      | 14                     |
| Random 1000 players game, x/y positions moving (big flat array)                  | 2000                   |
| 10x NestJS package.json, removing scripts and adding 2 fake dependencies to each | 30                     |

Tested on:

```yml
clk: ~2.15 GHz
cpu: AMD Ryzen 5 5600X 6-Core Processor
runtime: bun 1.2.6 (x64-win32)
```

### Diff Benchmarks

| Simple          | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 75.72 ns/iter       | 8.07 b                      |
| fast-json-patch | 256.55 ns/iter      | 22.00 b                     |
| jiff            | 909.61 ns/iter      | 186.51 b                    |
| microdiff       | 639.39 ns/iter      | 61.95 b                     |
| jsondiffts      | 2.33 µs/iter        | 352.30 b                    |
| rfc6902         | 7.29 µs/iter        | 768.44 b                    |

```
summary
  ultrapatch
   3.39x faster than fast-json-patch
   8.44x faster than microdiff
   12.01x faster than jiff
   30.72x faster than jsondiffts
   96.29x faster than rfc6902
```

---

| Complicated     | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 685.40 ns/iter      | 73.54 b                     |
| fast-json-patch | 1.75 µs/iter        | 153.60 b                    |
| jiff            | 2.90 µs/iter        | 277.83 b                    |
| microdiff       | 5.51 µs/iter        | 544.71 b                    |
| jsondiffts      | 17.06 µs/iter       | 1.38 kb                     |
| rfc6902         | 23.53 µs/iter       | 877.58 b                    |

```
summary
  ultrapatch
   2.56x faster than fast-json-patch
   4.23x faster than jiff
   8.04x faster than microdiff
   24.89x faster than jsondiffts
   34.33x faster than rfc6902
```

---

_Disclaimer: rfc6902 crashed in the following test so its excluded_

| randomgame      | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 419.57 µs/iter      | 16.74 kb                    |
| fast-json-patch | 327.15 µs/iter      | 38.26 kb                    |
| jiff            | 43.96 ms/iter       | 17.17 mb                    |
| microdiff       | 672.27 µs/iter      | 12.03 kb                    |
| jsondiffts      | 4.37 ms/iter        | 480.80 kb                   |

```
summary
  fast-json-patch
   1.28x faster than ultrapatch
   2.05x faster than microdiff
   13.36x faster than jsondiffts
   134.39x faster than jiff
```

---

| bignested       | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 123.36 µs/iter      | 2.06 kb                     |
| fast-json-patch | 132.89 µs/iter      | 6.51 kb                     |
| jiff            | 91.71 µs/iter       | 5.96 kb                     |
| microdiff       | 262.24 µs/iter      | 8.66 kb                     |
| jsondiffts      | 1.46 ms/iter        | 56.21 kb                    |
| rfc6902         | 14.10 ms/iter       | 442.24 kb                   |

```
summary
  jiff
   1.35x faster than ultrapatch
   1.45x faster than fast-json-patch
   2.86x faster than microdiff
   15.96x faster than jsondiffts
   153.77x faster than rfc6902
```

---

Overall, ultrapatch performs the best when performing diffs on not so big samples, however in the `randomgame` and `bignested` cases, it gets slightly outperformed by `fast-json-patch`/`jiff` whilst still keeping memory usage low.

### Patch Benchmarks

| Simple          | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 276.79 ns/iter      | 22.45 b                     |
| fast-json-patch | 457.46 ns/iter      | 38.42 b                     |
| json-joy        | 369.45 ns/iter      | 32.63 b                     |
| jiff            | 351.31 ns/iter      | 33.01 b                     |
| rfc6902         | 886.56 ns/iter      | 74.86 b                     |

```summary
summary
  ultrapatch
   1.27x faster than jiff
   1.33x faster than json-joy
   1.65x faster than fast-json-patch
   3.2x faster than rfc6902
```

---

| Complicated     | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 1.35 µs/iter        | 127.87 b                    |
| fast-json-patch | 2.10 µs/iter        | 253.99 b                    |
| json-joy        | 3.57 µs/iter        | 632.19 b                    |
| jiff            | 4.38 µs/iter        | 753.72 b                    |
| rfc6902         | 5.18 µs/iter        | 711.45 b                    |

```
summary
  ultrapatch
   1.56x faster than fast-json-patch
   2.65x faster than json-joy
   3.25x faster than jiff
   3.84x faster than rfc6902
```

---

| randomgame      | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 261.68 µs/iter      | 2.86 kb                     |
| fast-json-patch | 428.92 µs/iter      | 23.72 kb                    |
| json-joy        | 754.31 µs/iter      | 12.15 kb                    |
| jiff            | 679.41 µs/iter      | 46.99 kb                    |
| rfc6902         | 705.67 µs/iter      | 25.53 kb                    |

```summary
summary
  ultrapatch
   1.64x faster than fast-json-patch
   2.6x faster than jiff
   2.7x faster than rfc6902
   2.88x faster than json-joy
```

---

| bignested       | Avg. time per iter. | Avg. memory usage per iter. |
| --------------- | ------------------- | --------------------------- |
| ultrapatch      | 5.16 µs/iter        | 328.15 b                    |
| fast-json-patch | 8.11 µs/iter        | 708.10 b                    |
| json-joy        | 14.51 µs/iter       | 2.48 kb                     |
| jiff            | 102.06 µs/iter      | 5.61 kb                     |
| rfc6902         | 18.08 µs/iter       | 2.32 kb                     |

```
summary
  ultrapatch
   1.57x faster than fast-json-patch
   2.81x faster than json-joy
   3.5x faster than rfc6902
   19.78x faster than jiff
```

---

When it comes to patching, ultrapatch has the upper hand in every test.

## Testing & Contributing

Feel free to report bugs or issue suggestions for this project! Although supporting more types beyond the aforementioned primitive types is probably outside of the scope of what this project tries to achieve, I would be more than willing to add more in case people want them. Also any findings for further optimizations would be greatly appreciated!

To test and build the library, you need [Bun](https://bun.sh), `bun run build` builds the JS files and definition types inside `/dist` which is also the version of UltraPatch that is linked in the benchmarks inside `/bench`.

With `bun test`, you can see if your version passes through all tests that I have used when releasing the library. To run the benchmarks, use `bun bench:diff` and `bun bench:patch` (or the node equivalents with `npm run node:bench:...`).
