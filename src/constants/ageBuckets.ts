export type AgeBucketKey = "PV" | "30" | "60" | "90" | "+90";
export type AgeBucketAlias = "pv" | "d30" | "d60" | "d90" | "d90mas";
export type AgeStatusKey = AgeBucketKey | "PAZ_Y_SALDO";

export interface AgeBucketDefinition {
  key: AgeBucketKey;
  alias: AgeBucketAlias;
  shortLabel: string;
  badgeLabel: string;
  chartLabel: string;
  fillColor: string;
  textColor: string;
  previousFillColor: string;
}

export interface AgeBadgeStyle {
  key: AgeStatusKey | null;
  label: string;
  fillColor: string;
  textColor: string;
}

const PAID_OFF_BADGE: AgeBadgeStyle = {
  key: "PAZ_Y_SALDO",
  label: "Paz y saldo",
  fillColor: "#374151",
  textColor: "#FFFFFF",
};

export const AGE_BUCKETS: AgeBucketDefinition[] = [
  {
    key: "PV",
    alias: "pv",
    shortLabel: "PV",
    badgeLabel: "PV - Al dia",
    chartLabel: "PV",
    fillColor: "#10B981",
    textColor: "#04342C",
    previousFillColor: "#6EE7B7",
  },
  {
    key: "30",
    alias: "d30",
    shortLabel: "30",
    badgeLabel: "30 dias",
    chartLabel: "30 dias",
    fillColor: "#FBBF24",
    textColor: "#633806",
    previousFillColor: "#FDE68A",
  },
  {
    key: "60",
    alias: "d60",
    shortLabel: "60",
    badgeLabel: "60 dias",
    chartLabel: "60 dias",
    fillColor: "#F97316",
    textColor: "#4A1B0C",
    previousFillColor: "#FDBA74",
  },
  {
    key: "90",
    alias: "d90",
    shortLabel: "90",
    badgeLabel: "90 dias",
    chartLabel: "90 dias",
    fillColor: "#EF4444",
    textColor: "#FFFFFF",
    previousFillColor: "#FCA5A5",
  },
  {
    key: "+90",
    alias: "d90mas",
    shortLabel: "+90",
    badgeLabel: "+90 dias",
    chartLabel: "+90 dias",
    fillColor: "#B91C1C",
    textColor: "#FFFFFF",
    previousFillColor: "#F87171",
  },
];

export const AGE_BUCKET_BY_KEY: Record<AgeBucketKey, AgeBucketDefinition> =
  AGE_BUCKETS.reduce(
    (acc, bucket) => {
      acc[bucket.key] = bucket;
      return acc;
    },
    {} as Record<AgeBucketKey, AgeBucketDefinition>,
  );

export const AGE_BUCKET_BY_ALIAS: Record<AgeBucketAlias, AgeBucketDefinition> =
  AGE_BUCKETS.reduce(
    (acc, bucket) => {
      acc[bucket.alias] = bucket;
      return acc;
    },
    {} as Record<AgeBucketAlias, AgeBucketDefinition>,
  );

export const DASHBOARD_AGE_LABELS = AGE_BUCKETS.map((bucket) => bucket.chartLabel);
export const DASHBOARD_AGE_COLORS = AGE_BUCKETS.map((bucket) => bucket.fillColor);

export const DASHBOARD_AGE_COMPARATIVE_COLORS: Record<
  AgeBucketAlias,
  { active: string; previous: string }
> = AGE_BUCKETS.reduce(
  (acc, bucket) => {
    acc[bucket.alias] = {
      active: bucket.fillColor,
      previous: bucket.previousFillColor,
    };
    return acc;
  },
  {} as Record<AgeBucketAlias, { active: string; previous: string }>,
);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseAgeBucketFromNumber(value: number): AgeStatusKey {
  if (value <= 0) {
    return "PV";
  }
  if (value <= 30) {
    return "30";
  }
  if (value <= 60) {
    return "60";
  }
  if (value <= 90) {
    return "90";
  }
  return "+90";
}

export function resolveAgeStatusKey(raw: unknown): AgeStatusKey | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return parseAgeBucketFromNumber(raw);
  }

  if (typeof raw !== "string") {
    return null;
  }

  const normalized = normalizeText(raw);
  const compact = normalized.replace(/[^a-z0-9+]/g, "");

  if (
    compact.includes("pazysaldo") ||
    compact.includes("saldocero") ||
    compact.includes("saldosero") ||
    compact.includes("saldozero")
  ) {
    return "PAZ_Y_SALDO";
  }

  if (
    compact === "pv" ||
    compact === "porvencer" ||
    compact === "porvencerse" ||
    compact === "aldia" ||
    compact === "pvaldia"
  ) {
    return "PV";
  }

  if (
    compact === "30" ||
    compact === "30d" ||
    compact === "30dias" ||
    compact === "1a30dias" ||
    compact === "1a30"
  ) {
    return "30";
  }

  if (
    compact === "60" ||
    compact === "60d" ||
    compact === "60dias" ||
    compact === "31a60dias" ||
    compact === "31a60"
  ) {
    return "60";
  }

  if (
    compact === "90" ||
    compact === "90d" ||
    compact === "90dias" ||
    compact === "61a90dias" ||
    compact === "61a90"
  ) {
    return "90";
  }

  if (
    compact === "+90" ||
    compact === "90+" ||
    compact === "+90dias" ||
    compact === "90mas" ||
    compact === "masde90" ||
    compact === "masde90dias"
  ) {
    return "+90";
  }

  const numericValue = Number(compact.replace(/[^\d.-]/g, ""));
  if (Number.isFinite(numericValue) && compact !== "") {
    return parseAgeBucketFromNumber(numericValue);
  }

  return null;
}

export function getAgeBadgeStyle(
  raw: unknown,
  fallbackLabel?: string,
): AgeBadgeStyle {
  const resolvedKey = resolveAgeStatusKey(raw);
  if (resolvedKey === "PAZ_Y_SALDO") {
    return PAID_OFF_BADGE;
  }

  if (resolvedKey && resolvedKey in AGE_BUCKET_BY_KEY) {
    const bucket = AGE_BUCKET_BY_KEY[resolvedKey as AgeBucketKey];
    return {
      key: bucket.key,
      label: bucket.badgeLabel,
      fillColor: bucket.fillColor,
      textColor: bucket.textColor,
    };
  }

  return {
    key: null,
    label:
      fallbackLabel?.trim() ||
      (typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "-"),
    fillColor: PAID_OFF_BADGE.fillColor,
    textColor: PAID_OFF_BADGE.textColor,
  };
}
