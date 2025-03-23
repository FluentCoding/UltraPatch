import type { UltraPatchTypes } from "./types";

// thanks to https://github.com/Starcounter-Jack/JSON-Patch/blob/master/src/core.ts
export namespace JSONPatchTypes {
  export class JSONPatchTestError extends Error {
    constructor(
      public testedPath: string,
      public testedValue: UltraPatchTypes.Diffable,
      public actualValue: UltraPatchTypes.Diffable,
    ) {
      super(`Failed jsonpatchtest - path: ${testedPath}`);
    }
  }

  export type Operation =
    | AddOperation
    | RemoveOperation
    | ReplaceOperation
    | MoveOperation
    | CopyOperation
    | TestOperation;

  interface BaseOperation {
    path: string;
  }

  interface AddOperation extends BaseOperation {
    op: "add";
    value: UltraPatchTypes.Diffable;
  }

  interface RemoveOperation extends BaseOperation {
    op: "remove";
  }

  interface ReplaceOperation extends BaseOperation {
    op: "replace";
    value: UltraPatchTypes.Diffable;
  }

  interface MoveOperation extends BaseOperation {
    op: "move";
    from: string;
  }

  interface CopyOperation extends BaseOperation {
    op: "copy";
    from: string;
  }

  interface TestOperation extends BaseOperation {
    op: "test";
    value: UltraPatchTypes.Diffable;
  }
}
