"use client";

import { Section } from "../Section";
import { COMMON_FACILITIES } from "../constants";

export default function FacilitiesSection({
  selectedFacilities,
  toggleFacility,
}: {
  selectedFacilities: string[];
  toggleFacility: (f: string) => void;
}) {
  return (
    <Section title="共用設備">
      <div className="flex flex-wrap gap-2">
        {COMMON_FACILITIES.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => toggleFacility(f)}
            className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
              selectedFacilities.includes(f)
                ? "bg-accent text-white border-accent"
                : "bg-bg-2 text-ink-2 border-line hover:border-ink-3"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </Section>
  );
}
