import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="content-wrapper">
      <section className="content pt-4">
        <div className="container-fluid">
          <Card>
            <Card.Body>
              <h3>Acceso denegado</h3>
              <p>No tienes permisos para acceder a esta seccion.</p>
              <Link to="/">
                <Button variant="primary">Ir al inicio</Button>
              </Link>
            </Card.Body>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Unauthorized;
