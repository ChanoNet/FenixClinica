import React from 'react';
import { 
  TextField, 
  FormControl, 
  FormHelperText, 
  Select, 
  MenuItem, 
  InputLabel,
  FormControlLabel,
  Checkbox,
  Switch,
  RadioGroup,
  Radio,
  TextFieldProps,
  SelectProps,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

interface OptionType {
  value: string | number;
  label: string;
}

type FormFieldProps = {
  type: 'text' | 'password' | 'email' | 'number' | 'date' | 'time' | 'select' | 'checkbox' | 'switch' | 'radio' | 'textarea';
  name: string;
  value: any;
  onChange: (e: React.ChangeEvent<any> | SelectChangeEvent<any>) => void;
  onBlur?: (e: React.FocusEvent<any>) => void;
  label?: string;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  options?: OptionType[];
  multiple?: boolean;
  rows?: number;
  helperText?: string;
  className?: string;
} & Omit<TextFieldProps, 'type' | 'name' | 'value' | 'onChange' | 'onBlur' | 'label' | 'placeholder' | 'error' | 'required' | 'disabled' | 'fullWidth' | 'rows' | 'helperText' | 'className'>;

/**
 * Componente de campo de formulario que admite diferentes tipos de inputs
 */
const FormField: React.FC<FormFieldProps> = ({
  type,
  name,
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  error,
  required = false,
  disabled = false,
  fullWidth = true,
  options = [],
  multiple = false,
  rows = 4,
  helperText,
  className,
  ...rest
}) => {
  // Helper para determinar si hay un error
  const hasError = Boolean(error);

  switch (type) {
    case 'text':
    case 'password':
    case 'email':
    case 'number':
      return (
        <TextField
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          label={label}
          placeholder={placeholder}
          error={hasError}
          helperText={error || helperText}
          required={required}
          disabled={disabled}
          fullWidth={fullWidth}
          className={className}
          variant="outlined"
          margin="normal"
          {...rest}
        />
      );

    case 'textarea':
      return (
        <TextField
          multiline
          rows={rows}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          label={label}
          placeholder={placeholder}
          error={hasError}
          helperText={error || helperText}
          required={required}
          disabled={disabled}
          fullWidth={fullWidth}
          className={className}
          variant="outlined"
          margin="normal"
          {...rest}
        />
      );

    case 'select':
      return (
        <FormControl 
          fullWidth={fullWidth} 
          error={hasError} 
          required={required} 
          disabled={disabled}
          margin="normal"
          className={className}
        >
          <InputLabel id={`${name}-label`}>{label}</InputLabel>
          <Select
            labelId={`${name}-label`}
            name={name}
            value={value || (multiple ? [] : '')}
            onChange={(e: SelectChangeEvent<any>) => onChange(e)}
            onBlur={onBlur}
            label={label}
            placeholder={placeholder}
            multiple={multiple}
            {...rest as SelectProps}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(error || helperText) && (
            <FormHelperText>{error || helperText}</FormHelperText>
          )}
        </FormControl>
      );
      
    case 'checkbox':
      return (
        <FormControl component="fieldset" error={hasError} className={className}>
          <FormControlLabel
            control={
              <Checkbox
                name={name}
                checked={Boolean(value)}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                required={required}
              />
            }
            label={label || ''}
          />
          {(error || helperText) && (
            <FormHelperText>{error || helperText}</FormHelperText>
          )}
        </FormControl>
      );
      
    case 'switch':
      return (
        <FormControl component="fieldset" error={hasError} className={className}>
          <FormControlLabel
            control={
              <Switch
                name={name}
                checked={Boolean(value)}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                required={required}
              />
            }
            label={label || ''}
          />
          {(error || helperText) && (
            <FormHelperText>{error || helperText}</FormHelperText>
          )}
        </FormControl>
      );
      
    case 'radio':
      if (!options || options.length === 0) {
        return null;
      }
      
      return (
        <FormControl component="fieldset" error={hasError} className={className}>
          {label && <InputLabel>{label}</InputLabel>}
          <RadioGroup 
            name={name}
            value={value || ''}
            onChange={onChange}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio disabled={disabled} required={required} />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {(error || helperText) && (
            <FormHelperText>{error || helperText}</FormHelperText>
          )}
        </FormControl>
      );
      
    case 'date':
      return (
        <DatePicker
          label={label}
          value={value || null}
          onChange={(newValue) => {
            // Simular un evento para mantener la coherencia con useForm
            const simulatedEvent = {
              target: {
                name,
                value: newValue
              }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(simulatedEvent);
          }}
          slotProps={{
            textField: {
              fullWidth,
              required,
              disabled,
              error: hasError,
              helperText: error || helperText,
              name,
              onBlur,
              margin: "normal",
              className,
              ...rest
            }
          }}
        />
      );
      
    case 'time':
      return (
        <TimePicker
          label={label}
          value={value || null}
          onChange={(newValue) => {
            // Simular un evento para mantener la coherencia con useForm
            const simulatedEvent = {
              target: {
                name,
                value: newValue
              }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(simulatedEvent);
          }}
          slotProps={{
            textField: {
              fullWidth,
              required,
              disabled,
              error: hasError,
              helperText: error || helperText,
              name,
              onBlur,
              margin: "normal",
              className,
              ...rest
            }
          }}
        />
      );
      
    default:
      return null;
  }
};

export default FormField;
