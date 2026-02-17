import { FormEvent, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@app/store/store";
import { setCurrentUser } from "@app/store/reducers/auth";
import { clearSecurity } from "@app/store/reducers/security";
import { useChangePasswordService } from "@app/services/Auth/changePasswordService";

const CambiarContrasena = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const mustChangePassword = Boolean((currentUser as any)?.mustChangePassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { changeOwnPassword } = useChangePasswordService();

  const goToLogin = () => {
    dispatch(setCurrentUser(null));
    dispatch(clearSecurity());
    localStorage.removeItem("userAccess");
    navigate("/login");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword.trim()) {
      toast.error("La contrasena actual es obligatoria");
      return;
    }

    if (!newPassword.trim()) {
      toast.error("La nueva contrasena es obligatoria");
      return;
    }

    if (newPassword.trim().length < 5) {
      toast.error("La nueva contrasena debe tener al menos 5 caracteres");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      toast.error("La confirmacion de contrasena no coincide");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await changeOwnPassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (response?.success) {
        toast.success(response.message || "Contrasena actualizada exitosamente");
        goToLogin();
        return;
      }

      toast.error(response?.message || "No fue posible cambiar la contrasena");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-wrapper">
      <section className="content pt-3">
        <div className="container-fluid">
          <Row className="justify-content-center">
            <Col xl={7} lg={8} md={10}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-0 pb-0">
                  <h4 className="mb-1" style={{ fontWeight: 700 }}>
                    Cambiar contrasena
                  </h4>
                  <small className="text-muted">
                    {mustChangePassword
                      ? "Debes actualizar tu contrasena para continuar usando el sistema."
                      : "Actualiza tu contrasena de acceso."}
                  </small>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group>
                      <Form.Label>Contrasena actual</Form.Label>
                      <Form.Control
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="current-password"
                      />
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Nueva contrasena</Form.Label>
                      <Form.Control
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                      />
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Confirmar nueva contrasena</Form.Label>
                      <Form.Control
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end" style={{ gap: 8 }}>
                      {!mustChangePassword && (
                        <Button
                          type="button"
                          variant="outline-secondary"
                          onClick={() => navigate("/")}
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </Button>
                      )}

                      <Button type="submit" variant="primary" disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Actualizar contrasena"}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </section>
    </div>
  );
};

export default CambiarContrasena;
