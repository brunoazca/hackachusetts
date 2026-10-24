// Shared block-profile choices for the original map and chat tools.
export type CellMetric = {
  key: string;
  label: string;
  group: "Buildings" | "People";
  unit: "pct" | "year" | "usd" | "count" | "density";
  source: string;
  /** Higher value = darker color, except when reversed (older year built = darker). */
  reverse?: boolean;
};

export const CELL_METRICS = [
  { key: "yr_built_median", label: "Median year built", group: "Buildings", unit: "year", source: "assessor parcels", reverse: true },
  { key: "pct_built_pre1900", label: "Buildings before 1900", group: "Buildings", unit: "pct", source: "assessor parcels" },
  { key: "pct_built_pre1940", label: "Buildings before 1940", group: "Buildings", unit: "pct", source: "assessor parcels" },
  { key: "pct_built_1980_plus", label: "Buildings from 1980 on", group: "Buildings", unit: "pct", source: "assessor parcels" },
  { key: "parcels", label: "Parcels", group: "Buildings", unit: "count", source: "assessor parcels" },
  { key: "units", label: "Housing units", group: "Buildings", unit: "count", source: "assessor parcels" },
  { key: "pct_owner_occupied", label: "Owner-occupied parcels", group: "Buildings", unit: "pct", source: "assessor parcels" },
  { key: "value_median_fy26", label: "Median assessed value", group: "Buildings", unit: "usd", source: "assessor FY26" },
  { key: "pct_housing_pre1940", label: "Homes before 1940", group: "Buildings", unit: "pct", source: "ACS tract" },
  { key: "pct_housing_pre1960", label: "Homes before 1960", group: "Buildings", unit: "pct", source: "ACS tract" },
  { key: "pop_per_km2", label: "People per km²", group: "People", unit: "density", source: "tract population" },
  { key: "median_income", label: "Median household income", group: "People", unit: "usd", source: "ACS tract" },
  { key: "pct_poverty", label: "Residents in poverty", group: "People", unit: "pct", source: "ACS tract" },
  { key: "pct_renters", label: "Households renting", group: "People", unit: "pct", source: "ACS tract" },
  { key: "pct_people_of_color", label: "People of color", group: "People", unit: "pct", source: "ACS tract" },
  { key: "pct_limited_english_hh", label: "Limited-English households", group: "People", unit: "pct", source: "ACS tract" },
  { key: "asthma_pct", label: "Adults with asthma", group: "People", unit: "pct", source: "CDC PLACES" },
  { key: "svi_low_income_pct", label: "Low income (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_children_pct", label: "Children (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_older_adults_pct", label: "Older adults (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_disability_pct", label: "People with a disability (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_medical_illness_pct", label: "Medical illness (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_limited_english_pct", label: "Limited English (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_people_of_color_pct", label: "People of color (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
] as const satisfies readonly CellMetric[];

export type CellMetricKey = (typeof CELL_METRICS)[number]["key"];

