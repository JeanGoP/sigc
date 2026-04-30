import { Badge, Button, Card, Form, ListGroup, Spinner } from "react-bootstrap";
import type { FormEvent } from "react";
import type { ParametrizacionRole } from "@app/services/Parametrizacion/types";

interface RolesSidebarCardProps {
  loading: boolean;
  roles: ParametrizacionRole[];
  filteredRoles: ParametrizacionRole[];
  selectedRoleId: number | null;
  roleName: string;
  roleSearch: string;
  isSubmittingRole: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onRoleNameChange: (value: string) => void;
  onRoleSearchChange: (value: string) => void;
  onSelectRole: (role: ParametrizacionRole) => void;
  onNewRole: () => void;
  onSaveRole: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteRole: () => void;
}

export default function RolesSidebarCard({
  loading,
  roles,
  filteredRoles,
  selectedRoleId,
  roleName,
  roleSearch,
  isSubmittingRole,
  canCreate,
  canEdit,
  canDelete,
  onRoleNameChange,
  onRoleSearchChange,
  onSelectRole,
  onNewRole,
  onSaveRole,
  onDeleteRole,
}: RolesSidebarCardProps) {
  return (
    <Card className="shadow-sm border-0" style={{ minHeight: "72vh" }}>
      <Card.Header className="bg-white border-0 pb-2">
        <div className="d-flex justify-content-between align-items-center" style={{ gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Roles</div>
            <small className="text-muted">{roles.length} registrados</small>
          </div>
          <Button variant="primary" size="sm" onClick={onNewRole}>
            Nuevo rol
          </Button>
        </div>
        <Form.Control
          className="mt-2"
          value={roleSearch}
          onChange={(event) => onRoleSearchChange(event.target.value)}
          placeholder="Buscar rol"
        />
      </Card.Header>

      <Card.Body className="pt-2 d-flex flex-column" style={{ gap: 12 }}>
        <div style={{ maxHeight: "42vh", overflowY: "auto" }}>
          <ListGroup>
            {filteredRoles.map((role) => (
              <ListGroup.Item
                key={role.roleId}
                action
                active={role.roleId === selectedRoleId}
                onClick={() => {
                  void onSelectRole(role);
                }}
                style={{ cursor: "pointer" }}
                className="d-flex justify-content-between align-items-center"
              >
                <span>{role.roleName}</span>
                {role.roleId === selectedRoleId && <Badge variant="light">Actual</Badge>}
              </ListGroup.Item>
            ))}

            {loading && roles.length === 0 && (
              <ListGroup.Item className="text-muted text-center">
                <Spinner animation="border" size="sm" /> Cargando roles...
              </ListGroup.Item>
            )}

            {!loading && filteredRoles.length === 0 && (
              <ListGroup.Item className="text-muted">No hay roles para este filtro</ListGroup.Item>
            )}
          </ListGroup>
        </div>

        <Form className="border-top pt-3" onSubmit={onSaveRole}>
          <Form.Group>
            <Form.Label>Nombre del rol</Form.Label>
            <Form.Control
              value={roleName}
              onChange={(event) => onRoleNameChange(event.target.value)}
              placeholder="Ej: Supervisor"
              disabled={isSubmittingRole}
            />
          </Form.Group>

          <div className="d-flex justify-content-between" style={{ gap: 8 }}>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingRole || (selectedRoleId ? !canEdit : !canCreate)}
            >
              {isSubmittingRole ? "Guardando..." : selectedRoleId ? "Actualizar" : "Crear"}
            </Button>

            <Button
              type="button"
              variant="outline-danger"
              onClick={onDeleteRole}
              disabled={!selectedRoleId || !canDelete}
            >
              Eliminar
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
