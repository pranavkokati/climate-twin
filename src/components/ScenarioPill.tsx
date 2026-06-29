"use client";

import { SCENARIO_LABEL } from "@/lib/scenarios";
import type { Scenario } from "@/lib/types";

export function ScenarioPill({
  scenario,
  active,
  onClick,
}: {
  scenario: Scenario;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="scenario-pill"
      data-active={active}
      onClick={onClick}
      aria-pressed={active}
    >
      {SCENARIO_LABEL[scenario]}
    </button>
  );
}
