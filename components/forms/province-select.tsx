import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { KALIMANTAN_PROVINCES, OTHER_PROVINCES } from "@/lib/constants/regions";

type ProvinceSelectProps = React.ComponentProps<typeof NativeSelect> & {
  /** Adds an empty first option, for filters. */
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export function ProvinceSelect({
  allowEmpty,
  emptyLabel = "Semua provinsi",
  ...props
}: ProvinceSelectProps) {
  return (
    <NativeSelect {...props}>
      {allowEmpty ? <NativeSelectOption value="">{emptyLabel}</NativeSelectOption> : null}
      <NativeSelectOptGroup label="Kalimantan">
        {KALIMANTAN_PROVINCES.map((province) => (
          <NativeSelectOption key={province} value={province}>
            {province}
          </NativeSelectOption>
        ))}
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Provinsi lain">
        {OTHER_PROVINCES.map((province) => (
          <NativeSelectOption key={province} value={province}>
            {province}
          </NativeSelectOption>
        ))}
      </NativeSelectOptGroup>
    </NativeSelect>
  );
}
