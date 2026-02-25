/**
 * Defines a lookup table where every value is constrained to a known
 * set of identifiers. If an identifier is removed from the source set,
 * every reference in the lookup table becomes a compile error.
 *
 * @example
 * const RULE_IDS = ["RULE_1001", "RULE_1002", "RULE_2001"] as const;
 *
 * const terms = defineLookup(RULE_IDS, {
 *   "market value":     "RULE_1001",
 *   "neighborhood":     "RULE_2001",
 *   "zoning":           "RULE_9999",  // COMPILE ERROR
 * });
 */
export interface TypedLookup<
  IDs extends readonly string[],
  Keys extends string,
> {
  readonly validIds: ReadonlySet<IDs[number]>;
  readonly table: Readonly<Record<Keys, IDs[number] | readonly IDs[number][]>>;
  get(key: Keys): IDs[number] | readonly IDs[number][];
  validate(): void;
}

export function defineLookup<
  const IDs extends readonly string[],
  const Keys extends string,
>(
  validIds: IDs,
  table: Record<Keys, IDs[number] | readonly IDs[number][]>,
): TypedLookup<IDs, Keys> {
  const idSet = new Set(validIds) as ReadonlySet<IDs[number]>;

  return {
    validIds: idSet,
    table,
    get(key: Keys) {
      return table[key];
    },
    validate() {
      for (const [key, value] of Object.entries(table)) {
        const values = Array.isArray(value)
          ? (value as string[])
          : [value as string];
        for (const v of values) {
          if (!idSet.has(v as IDs[number])) {
            throw new Error(
              `Lookup key "${key}" references invalid ID "${v}"`,
            );
          }
        }
      }
    },
  };
}
