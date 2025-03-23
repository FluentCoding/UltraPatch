# UltraPatch

- 100% coverage of [JSON Patch Tests](https://github.com/json-patch/json-patch-tests/blob/master/tests.json) (excluding faulty ones, see below)
- Runs in all modern JavaScript runtimes like Bun, Node.JS, Deno but also Browsers
- TypeScript & CommonJS support, zero dependencies and extremely lightweight
---

A very fast JSONPatch library that is capable of generating diffs and patching existing objects with compatible diffs. The implementation is naive, meaning that it does not handle edge cases like...
- circular references
- using ínvalid diffs when patching
- using non-supported types, this library only supports **`string | number | bigint | boolean | undefined | null`** or nested objects/arrays with those types, the library intentionally does not try to cover `Set | RegExp | Symbol`, class instances, ...

When doing one of those things wrong, in best case, you will (sometimes) get cryptic errors when patching with invalid diffs, and in worst case you will be stuck in an infinite loop due to a circular reference when diffing.

If you want to diff/patch internally or, in a network environment, synchronize state from an authoritative server to clients whilst leveraging a technology like WebSockets, where you can **reliably** send **in-order** patches of state, then this library is for you. You can also feel free to generate diffs with any other library of your choice (as long as it complies with the JSONPatch standards) and only leverage the patch functionality that this library provides, or do the reverse.

## Usage

Install this library with the package manager of your choice:

```
bun add ultrapatch
npm i ultrapatch
deno add npm:ultrapatch
```

... then simply use the two provided methods like this:

```ts
import * as UltraPatch from "ultrapatch";

// returns the list of changes in JSONPatch format
const diff = UltraPatch.diff({ a: 1, b: [1, 2] }, { a: 2, b: [1, 2, 3] });

// modifies the first argument in-place to apply the changes in the second argument and returns the result (reference to first argument or entirely new object in case you modify at root-level)
const desired = UltraPatch.patch({ a: 1, b: [1, 2] }, diff);

// desired === { a: 2, b: [1, 2, 3] }
```

## Performance

Due to the given constraints that I have set for UltraPatch, this library is able to outperform the currently fastest JSONPatch implementations by orders of magnitude (in best case) in both diffing and patching. This comes at the price of only supporting basic datatypes, not verifying validity of diffs when patching and risking infinite loops if working with objects that include circular references.

If you are curious about how the benchmarks have been created, please read the section below in how you can test the benchmarks yourselves.

## Testing & Contributing

Feel free to report bugs or issue suggestions for this project! Although supporting more types beyond the aforementioned primitive types is probably outside of the scope of what this project tries to achieve, I would be more than willing to add more in case people want them. Also any findings for further optimizations would be greatly appreciated!

To test and build the library, you need [Bun](https://bun.sh), `bun run build` builds the JS files and definition types inside `/dist` which is also the version of UltraPatch that is linked in the benchmarks inside `/bench`.

With `bun test`, you can see if your version passes through all tests that I have used when releasing the library. To run the benchmarks, use `bun bench:diff` and `bun bench:patch` (or the node equivalents with `npm run node:bench:...`).
