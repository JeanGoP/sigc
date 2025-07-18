import React, { useState } from "react";
import { Modal, Button, FormControl, Table } from "react-bootstrap";
import { colorsForSelection } from "@app/Data/colorsForSelection";

interface ColorPickerModalProps {
  value: string; // color HEX seleccionado
  onChange: (colorHex: string) => void;
}

// Importa tu variable original

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  value,
  onChange,
}) => {
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState("");
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [activeCell, setActiveCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const handleSelectColor = (hex: string) => {
    console.log("ColorPicker - Color seleccionado:", hex);
    onChange(hex);
    setShow(false);
    setFilter("");
  };

  let hoverTimeout: NodeJS.Timeout;

  const handleMouseEnter = (row: number, col: number) => {
    hoverTimeout = setTimeout(() => {
      setActiveCell({ row, col });
    }, 300); // 1 segundo
    setHoveredCell({ row, col });
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
    setHoveredCell(null);
    setActiveCell(null);
  };

  // Reorganizar por filas: cada fila es un "orden" (1 a 10), cada columna es una tonalidad
  const rows = Array.from({ length: 7 }, (_, rowIndex) =>
    colorsForSelection.map(
      (col) =>
        col.colores.find((color) => color.orden - 3 === rowIndex + 1)?.hex || "#fff"
    )
  );

  // Filtro opcional
  const filteredRows = filter
    ? rows.map((row) =>
        row.map((hex) =>
          hex.toLowerCase().includes(filter.toLowerCase()) ? hex : null
        )
      )
    : rows;

  return (
    <>
      <Button
        variant="outline-secondary"
        onClick={() => setShow(true)}
        className="d-flex align-items-center"
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: value || "#ccc",
            border: "1px solid #999",
            marginRight: "0.5rem",
          }}
        />
        {value || "Seleccionar color"}
      </Button>

      <Modal show={show} onHide={() => setShow(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Seleccionar color</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormControl
            placeholder="Buscar por HEX (#...)"
            className="mb-3"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div style={{ overflowX: "auto" }}>
            <Table bordered responsive style={{ tableLayout: "fixed" }}>
              <tbody>
                {filteredRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((hex, colIndex) => (
                      <td
                        key={colIndex}
                        onMouseEnter={() =>
                          handleMouseEnter(rowIndex, colIndex)
                        }
                        onMouseLeave={handleMouseLeave}
                        onClick={() => hex && handleSelectColor(hex)}
                        title={hex || "Sin coincidencia"}
                        className={`color-cell ${
                          activeCell?.row === rowIndex &&
                          activeCell?.col === colIndex
                            ? "hovered"
                            : ""
                        }`}
                        style={{
                          backgroundColor: hex || "#fff",
                          cursor: hex ? "pointer" : "default",
                          height: 50,
                          padding: 0,
                          border:
                            hex === value ? "5px solid #000" : "1px solid #ccc",
                        }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ColorPickerModal;
