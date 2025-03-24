export namespace UltraPatchTypes {
  type Primitive = string | boolean | number | bigint | null | undefined;

  export type Diffable =
    | Primitive
    | Diffable[]
    | {
        [index: string]: Diffable;
      };

  export type DiffableCollection = Record<string, Diffable> | Diffable[];
}
