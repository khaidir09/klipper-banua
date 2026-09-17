/**
 * Money is stored as whole Rupiah in `bigint` columns (PRD section 7).
 * Never convert amounts to float before formatting.
 */
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "decimal",
  maximumFractionDigits: 0,
});

/** Formats whole Rupiah, e.g. `Rp 1.500.000`. */
export function formatRupiah(amount: bigint | number | string): string {
  return `Rp ${formatAmountDigits(amount)}`;
}

/** Same as `formatRupiah` but without the currency prefix, e.g. for table cells. */
export function formatAmountDigits(amount: bigint | number | string): string {
  const value = toBigInt(amount);
  const isNegative = value < 0n;
  const absolute = isNegative ? -value : value;
  return `${isNegative ? "-" : ""}${rupiahFormatter.format(absolute)}`;
}

/**
 * Accepts the shapes money arrives in: `bigint` from the database, `number`
 * from form inputs and `string` from JSON payloads. Fractions are truncated
 * towards zero because Rupiah amounts are whole numbers.
 */
export function toBigInt(amount: bigint | number | string): bigint {
  if (typeof amount === "bigint") return amount;

  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) {
      throw new TypeError(`Cannot format a non-finite amount: ${amount}`);
    }
    return BigInt(Math.trunc(amount));
  }

  const trimmed = amount.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new TypeError(`Cannot format a non-numeric amount: ${amount}`);
  }
  return BigInt(trimmed);
}
