export interface CalendarioVisibleRange {
  start: Date;
  end: Date;
}

export interface CalendarioUserOption {
  label: string;
  value: string | number;
}

export type CalendarioRangeInput =
  | Date[]
  | {
      start: Date;
      end: Date;
    };
