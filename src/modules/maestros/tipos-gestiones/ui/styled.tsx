import { Button, Form, Modal } from "react-bootstrap";
import styled from "styled-components";

export const StyledCard = styled.div`
  margin-bottom: 1rem;
  background: white;
  border-radius: 0.25rem;
  box-shadow:
    0 0 1px rgba(0, 0, 0, 0.125),
    0 1px 3px rgba(0, 0, 0, 0.2);
`;

export const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 0.5rem;
    border: none;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }
`;

export const StyledFormGroup = styled(Form.Group)`
  margin-bottom: 1.5rem;

  .form-label {
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }

  .form-control {
    border-radius: 0.375rem;
    border: 1px solid #ced4da;
    padding: 0.5rem 0.75rem;
  }
`;

export const StyledButton = styled(Button)`
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  border-radius: 0.375rem;
`;
