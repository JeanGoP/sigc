import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerMuiProps {
  placeHolder?: string;
  onDateChange?: (dateString: string) => void;
}

const DatePickerMui: React.FC<DatePickerMuiProps> = ({ placeHolder, onDateChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    if (selectedDate && onDateChange) {
      const dateString = selectedDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
      onDateChange(dateString);
    }
  }, [selectedDate, onDateChange]);

  return (
    <Form.Group>
      <Form.Label>{placeHolder}</Form.Label>
      <br />
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => setSelectedDate(date)}
        dateFormat="yyyy-MM-dd"
        className="form-control w-100"
        placeholderText="YYYY-MM-DD"
      />
    </Form.Group>
  );
};

export default DatePickerMui;
