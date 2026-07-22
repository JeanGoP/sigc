import React from "react";
import { Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import type { TableColumn } from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import { DynamicTablePaginationConsultaCartera } from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacionConsultaCartera";
import { FiltrosCarteras } from "./FiltrosCarteras/FiltrosCarteras";

type ConsultaCarteraRow = Record<string, unknown>;

interface ConsultaCarteraSidebarProps {
  collapsed: boolean;
  menuFiltrosState: boolean;
  inputRef: React.Ref<HTMLInputElement>;
  tablaSearch: string;
  tablaLoading: boolean;
  columns: TableColumn[];
  tablaRows: ConsultaCarteraRow[];
  tablaTotalRows: number;
  totalSaldoCartera: number;
  tablaRowsPerPage: number;
  tablaPage: number;
  hasFullSelection: boolean;
  registroSeleccionado: ConsultaCarteraRow | null;
  onSearchChange: (value: string) => void;
  onFetchFacturas: () => void | Promise<unknown>;
  onToggleFilters: () => void;
  onToggleCollapsed: () => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onPageChange: (page: number) => void;
  onRowEnter: (row: ConsultaCarteraRow) => void;
  onExportToCsv?: () => void;
  exporting: boolean;
}

export function ConsultaCarteraSidebar({
  collapsed,
  menuFiltrosState,
  inputRef,
  tablaSearch,
  tablaLoading,
  columns,
  tablaRows,
  tablaTotalRows,
  totalSaldoCartera,
  tablaRowsPerPage,
  tablaPage,
  hasFullSelection,
  registroSeleccionado,
  onSearchChange,
  onFetchFacturas,
  onToggleFilters,
  onToggleCollapsed,
  onRowsPerPageChange,
  onPageChange,
  onRowEnter,
  onExportToCsv,
  exporting,
}: ConsultaCarteraSidebarProps) {
  return (
    <div
      className={` side-panel ${
        collapsed ? "collapsed" : "col col-sm-4 col-md-5 col-lg-4"
      }`}
    >
      <div className="d-flex align-items-center p-2 gap-2">
        <div className="d-flex align-items-center flex-grow-1">
          <Form.Control
            ref={inputRef}
            type="text"
            placeholder="Buscar"
            value={tablaSearch}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(event.target.value)
            }
            disabled={tablaLoading}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onFetchFacturas();
              }
            }}
            style={{
              display: collapsed || menuFiltrosState ? "none" : "block",
            }}
          />
          <Button
            variant="primary"
            onClick={() => void onFetchFacturas()}
            disabled={tablaLoading}
            style={{
              marginLeft: 8,
              minWidth: 40,
              display: collapsed || menuFiltrosState ? "none" : "block",
            }}
            title="Consultar"
          >
            <i className="fas fa-search" />
          </Button>
        </div>
        <div className="d-flex align-items-center">
          <Button
            variant={!menuFiltrosState ? "outline-primary" : "primary"}
            onClick={onToggleFilters}
            style={{
              minWidth: 40,
              margin: "0 10px",
              justifySelf: "center",
              display: collapsed ? "none" : "block",
            }}
            title="Consultar"
          >
            <i className="fas fa-filter" />
          </Button>
          <button
            className={
              "btn " + (collapsed ? "btn-sm" : "btn") + " btn-outline-primary"
            }
            onClick={onToggleCollapsed}
          >
            {collapsed ? (
              <FontAwesomeIcon icon={faArrowRight} />
            ) : (
              <FontAwesomeIcon icon={faArrowLeft} />
            )}
          </button>
        </div>
      </div>
      <div className="xd" style={{ display: collapsed ? "none" : "block" }}>
        {menuFiltrosState ? (
          <div>
            <FiltrosCarteras state={menuFiltrosState} onApply={onToggleFilters} />
          </div>
        ) : (
          <DynamicTablePaginationConsultaCartera
            columns={columns}
            rows={tablaRows}
            totalRows={tablaTotalRows}
            totalSaldoCartera={totalSaldoCartera}
            searchText={tablaSearch}
            onSearchChange={onSearchChange}
            rowsPerPage={tablaRowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            rowPageOptions={[50, 100, 150, 200]}
            withSearch={false}
            maxHeight={"80vh"}
            page={tablaPage}
            onPageChange={onPageChange}
            enableKeyboardNavigation={true}
            onRowEnter={onRowEnter}
            onExportToCsv={onExportToCsv}
            exporting={exporting}
            selectedPredicate={(row) =>
              Boolean(
                hasFullSelection &&
                  row?.cliente &&
                  registroSeleccionado &&
                  String(row.cliente) ===
                    String(registroSeleccionado.cliente ?? "") &&
                  String(row.cuenta ?? "") ===
                    String(registroSeleccionado.cuenta ?? "")
              )
            }
          />
        )}
      </div>
    </div>
  );
}
