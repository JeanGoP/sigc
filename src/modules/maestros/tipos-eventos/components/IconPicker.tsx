import React, { useState } from "react";
import {
  Modal,
  Button,
  FormControl,
  Row,
  Col,
  Container,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Importar FontAwesomeIcon
import { iconList, IconItem } from "@app/Data/iconForSelectIconPicker"; // Importar iconList y su interfaz

interface IconPickerModalProps {
  value: string; // La clave del icono (string) que se guarda en la DB
  onChange: (iconKey: string) => void; // onChange ahora recibe la clave del icono
  selectedColor: string; // Color seleccionado, opcional
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const IconPickerModal: React.FC<IconPickerModalProps> = ({
  value,
  onChange,
  selectedColor,
}) => {
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState("");

  // Encontrar el objeto de ícono completo basado en la clave (value)
  const selectedIcon = iconList.find((item) => item.key === value);

  const handleOpenModal = (val: boolean) => {
    setShow(val);
    console.log("Selected Color:", selectedColor);
  };

  const filteredIcons = iconList.filter(
    (iconItem: IconItem) =>
      normalize(iconItem.key).includes(normalize(filter)) ||
      normalize(iconItem.label).includes(normalize(filter))
  );

  const handleIconSelect = (iconKey: string) => {
    onChange(iconKey);
    setShow(false);
    setFilter(""); // Limpiar el filtro al cerrar el modal
  };

  return (
    <>
      <Button
        variant="outline-primary"
        onClick={() => handleOpenModal(true)}
        className="d-flex align-items-center"
      >
        {selectedIcon ? (
          <>
            <FontAwesomeIcon
              icon={selectedIcon.icon}
              className="mr-2"
              style={{ color: selectedColor }} // Aplicar el color seleccionado al ícono
            />
            {selectedIcon.label}
          </>
        ) : (
          "Seleccionar ícono"
        )}
      </Button>

      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header>
          <Modal.Title>Seleccionar ícono</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormControl
            placeholder="Buscar ícono por nombre o etiqueta..."
            className="mb-3"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Container>
            <Row
              className="icon-grid"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {filteredIcons.map((iconItem: IconItem) => (
                <Col
                  key={iconItem.key}
                  xs={4}
                  sm={3}
                  md={2}
                  className="mb-3 text-center"
                >
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id={`tooltip-${iconItem.key}`}>
                        {iconItem.label}
                      </Tooltip>
                    }
                  >
                    <Button
                      variant={iconItem.key === value ? "primary" : "light"}
                      className="w-100 d-flex flex-column align-items-center justify-content-center py-3"
                      onClick={() => handleIconSelect(iconItem.key)}
                      style={{ height: "85px" }} // Altura fija para los botones de íconos
                    >
                      <FontAwesomeIcon
                        icon={iconItem.icon}
                        size="2x"
                        style={{ color: selectedColor }}
                      />
                      {/* <div className="small mt-1 text-truncate" style={{ maxWidth: '100%' }}>{iconItem.label}</div> */}
                    </Button>
                  </OverlayTrigger>
                </Col>
              ))}
              {filteredIcons.length === 0 && (
                <Col xs={12}>
                  <div className="text-muted text-center">Sin resultados</div>
                </Col>
              )}
            </Row>
          </Container>
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

export default IconPickerModal;
