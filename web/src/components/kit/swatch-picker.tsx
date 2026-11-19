import { Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import type { PaintSwatch } from "@/lib/paint-palette";

type SwatchPickerProps = {
  swatches: readonly PaintSwatch[];
  /** Selected hex, or null for none. */
  value: string | null;
  onValueChange: (swatch: PaintSwatch) => void;
  label: string;
  /** Element id prefix, unique per picker on the page. */
  id: string;
};

const sameHex = (a: string | null, b: string) => a?.toLowerCase() === b.toLowerCase();

/** Curated paint swatches plus a custom-hex picker. Swatch colours are paint data, not theme. */
export function SwatchPicker({ swatches, value, onValueChange, label, id }: SwatchPickerProps) {
  const selected = swatches.find((swatch) => sameHex(value, swatch.hex));
  const selectedName = selected?.name ?? (value ? `${copy.swatches.customName} ${value}` : null);

  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {swatches.map((swatch) => {
          const isOn = sameHex(value, swatch.hex);
          return (
            <button
              key={swatch.hex}
              type="button"
              role="radio"
              aria-checked={isOn}
              aria-label={swatch.name}
              title={swatch.name}
              onClick={() => onValueChange(swatch)}
              style={{ backgroundColor: swatch.hex }}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border border-foreground/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isOn && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            >
              {isOn && <Check className="size-4 text-foreground" aria-hidden="true" />}
            </button>
          );
        })}
        <label
          htmlFor={`${id}-custom`}
          title={copy.swatches.custom}
          className="relative flex size-11 cursor-pointer items-center justify-center rounded-full border border-dashed border-input text-muted-foreground focus-within:ring-3 focus-within:ring-ring/50 hover:text-foreground"
        >
          <Pipette className="size-4" aria-hidden="true" />
          <span className="sr-only">{copy.swatches.custom}</span>
          <input
            id={`${id}-custom`}
            type="color"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) =>
              onValueChange({ hex: event.target.value, name: copy.swatches.customName })
            }
          />
        </label>
      </div>
      {selectedName && (
        <p className="text-label font-bold text-muted-foreground" aria-live="polite">
          {selectedName}
        </p>
      )}
    </div>
  );
}
