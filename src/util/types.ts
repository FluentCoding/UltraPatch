export namespace UltraPatchTypes {
  type Primitive = string | boolean | number | bigint | null | undefined;

  export type Diffable =
    | Primitive
    | Array<Primitive | Diffable>
    | {
        [index: string]: Primitive | Diffable;
      };

  export type DiffableCollection =
    | Record<string, UltraPatchTypes.Diffable>
    | UltraPatchTypes.Diffable[];
}
