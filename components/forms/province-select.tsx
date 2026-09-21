import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PROVINCES } from "@/lib/constants/regions";

type ProvinceSelectProps = React.ComponentProps<typeof NativeSelect> & {
  /** Adds an empty first option, for filters. */
  allowEmpty?: boolean;
  emptyLabel?: string;
};

/**
 * Only Kalimantan provinces are offered, so the list needs no grouping.
 *
 * Callers that register this with React Hook Form must also pass
 * `defaultValue`: `register()` sets the selection through a ref after mount,
 * which a server-rendered page loses during hydration, leaving the first
 * option selected while the form state holds something else.
 */
export function ProvinceSelect({
  allowEmpty,
  emptyLabel = "Semua provinsi",
  ...props
}: ProvinceSelectProps) {
  return (
    <NativeSelect {...props}>
      {allowEmpty ? <NativeSelectOption value="">{emptyLabel}</NativeSelectOption> : null}
      {PROVINCES.map((province) => (
        <NativeSelectOption key={province} value={province}>
          {province}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
