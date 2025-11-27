import Form from "react-bootstrap/Form";

const SeleccionarEmpresa = () => {
  return (
    <div>
      <Form>
        <Form.Group controlId="exampleForm.ControlSelect1">
          <Form.Label>Example select</Form.Label>
          <Form.Control as="select">
            <option value={"a"}>df</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
          </Form.Control>
        </Form.Group>
        
      </Form>
    </div>
  );
};

export default SeleccionarEmpresa;
