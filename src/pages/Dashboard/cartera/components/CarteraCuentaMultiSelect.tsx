import React from "react";
import { createPortal } from "react-dom";
import Select, { components, type MenuListProps, type MultiValue } from "react-select";

export type CarteraCuentaOption = {
  value: string;
  label: string;
};

export function CarteraCuentaMultiSelect({
  options,
  selectedValues,
  onSelectedValuesChange,
  label = "Carteras",
  placeholder = "Selecciona carteras...",
  disabled = false,
}: {
  options: CarteraCuentaOption[];
  selectedValues: ReadonlySet<string>;
  onSelectedValuesChange: (next: Set<string>) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const inputId = React.useId();
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = React.useRef<number | null>(null);
  const hideTimeoutRef = React.useRef<number | null>(null);
  const hoverAnchorRef = React.useRef(false);
  const hoverTooltipRef = React.useRef(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipRect, setTooltipRect] = React.useState<{
    top: number;
    left: number;
    maxWidth: number;
    placement: "top" | "bottom";
  } | null>(null);

  const selectedOptions = React.useMemo(
    () => options.filter((option) => selectedValues.has(option.value)),
    [options, selectedValues],
  );

  const handleChange = React.useCallback(
    (values: MultiValue<CarteraCuentaOption>) => {
      onSelectedValuesChange(new Set(values.map((value) => value.value)));
    },
    [onSelectedValuesChange],
  );

  const handleSelectAll = React.useCallback(() => {
    onSelectedValuesChange(new Set(options.map((option) => option.value)));
  }, [onSelectedValuesChange, options]);

  const handleSelectNone = React.useCallback(() => {
    onSelectedValuesChange(new Set());
  }, [onSelectedValuesChange]);

  const countLabel = `${selectedOptions.length}/${options.length}`;
  const effectivePlaceholder = `${label}: ${countLabel}`;

  const tooltipBody = React.useMemo(() => {
    if (selectedOptions.length === 0) {
      return "Ninguna seleccionada";
    }

    return selectedOptions.map((option) => option.label).join("\n");
  }, [selectedOptions]);

  React.useLayoutEffect(() => {
    if (!showTooltip) {
      setTooltipRect(null);
      return;
    }

    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const margin = 8;
    const estimatedHeight = 180;
    const maxWidth = Math.min(360, Math.max(220, viewportWidth - margin * 2));

    const preferredTop = rect.top - margin;
    const preferredBottom = rect.bottom + margin;
    const fitsTop = preferredTop - estimatedHeight >= margin;
    const placement: "top" | "bottom" =
      fitsTop || preferredBottom + estimatedHeight > viewportHeight - margin
        ? "top"
        : "bottom";

    const left = Math.min(
      viewportWidth - margin - maxWidth,
      Math.max(margin, rect.left),
    );
    const top = placement === "top" ? preferredTop : preferredBottom;

    setTooltipRect({ top, left, maxWidth, placement });
  }, [showTooltip]);

  const handleMouseEnter = React.useCallback(() => {
    hoverAnchorRef.current = true;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, 1000);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    hoverAnchorRef.current = false;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (!hoverTooltipRef.current) {
      setShowTooltip(false);
      return;
    }

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      if (!hoverAnchorRef.current && !hoverTooltipRef.current) {
        setShowTooltip(false);
      }
    }, 620);
  }, []);

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const MenuList = React.useCallback(
    (props: MenuListProps<CarteraCuentaOption, true>) => (
      <components.MenuList {...props}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            padding: "6px 8px",
            borderBottom: "1px solid #eef2f6",
          }}
        >
          <span style={{ fontSize: 11, color: "#6c757d", minWidth: 0, wordBreak: "break-word" }}>
            {label}: {countLabel}
          </span>
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 6 }}>
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={props.selectProps.isDisabled}
              style={{
                padding: "1px 8px",
                fontSize: 11,
                borderRadius: 999,
                border: "1px solid #d0d5dd",
                background: "#fff",
                color: "#344054",
                cursor: props.selectProps.isDisabled ? "not-allowed" : "pointer",
              }}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={handleSelectNone}
              disabled={props.selectProps.isDisabled}
              style={{
                padding: "1px 8px",
                fontSize: 11,
                borderRadius: 999,
                border: "1px solid #d0d5dd",
                background: "#fff",
                color: "#344054",
                cursor: props.selectProps.isDisabled ? "not-allowed" : "pointer",
              }}
            >
              Ninguno
            </button>
          </div>
        </div>
        {props.children}
      </components.MenuList>
    ),
    [countLabel, handleSelectAll, handleSelectNone, label],
  );

  return (
    <div
      ref={anchorRef}
      style={{ width: 260, maxWidth: "100%", marginBottom: 8 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showTooltip &&
        tooltipRect &&
        createPortal(
          <div
            role="tooltip"
            onMouseEnter={() => {
              hoverTooltipRef.current = true;
              if (hideTimeoutRef.current) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              hoverTooltipRef.current = false;
              if (!hoverAnchorRef.current) {
                setShowTooltip(false);
              }
            }}
            style={{
              position: "fixed",
              left: tooltipRect.left,
              top: tooltipRect.top,
              transform: tooltipRect.placement === "top" ? "translateY(-100%)" : "none",
              background: "#111",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 11,
              maxWidth: tooltipRect.maxWidth,
              zIndex: 10000,
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.25)",
              pointerEvents: "auto",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {label}: {countLabel}
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto", whiteSpace: "pre-wrap" }}>
              {tooltipBody}
            </div>
          </div>,
          document.body,
        )}
      <Select<CarteraCuentaOption, true>
        inputId={inputId}
        isMulti
        isDisabled={disabled}
        isSearchable
        closeMenuOnSelect={false}
        controlShouldRenderValue={false}
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        onMenuOpen={() => {
          hoverAnchorRef.current = false;
          hoverTooltipRef.current = false;
          setShowTooltip(false);
        }}
        placeholder={effectivePlaceholder}
        components={{ MenuList }}
        styles={{
          container: (base) => ({
            ...base,
            width: "100%",
          }),
          control: (base, state) => ({
            ...base,
            minHeight: 28,
            borderRadius: 8,
            borderColor: state.isFocused ? "#4f86c6" : "#d0d5dd",
            boxShadow: state.isFocused ? "0 0 0 2px #4f86c622" : "none",
            ":hover": {
              borderColor: state.isFocused ? "#4f86c6" : "#c0c6cf",
            },
          }),
          valueContainer: (base) => ({
            ...base,
            padding: "0 8px",
          }),
          input: (base) => ({
            ...base,
            margin: 0,
            padding: 0,
          }),
          dropdownIndicator: (base) => ({
            ...base,
            paddingTop: 0,
            paddingBottom: 0,
          }),
          clearIndicator: (base) => ({
            ...base,
            paddingTop: 0,
            paddingBottom: 0,
          }),
          placeholder: (base) => ({
            ...base,
            color: "#9aa0a6",
            fontSize: 12,
            margin: 0,
          }),
          menu: (base) => ({
            ...base,
            zIndex: 30,
          }),
          menuList: (base) => ({
            ...base,
            maxHeight: 240,
            paddingTop: 0,
            paddingBottom: 0,
          }),
        }}
      />
    </div>
  );
}
