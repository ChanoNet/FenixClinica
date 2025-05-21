import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { ValidationSchema, validateForm, ValidationErrors } from '../utils/validation';

/**
 * Hook personalizado para gestionar formularios con validación
 * @param initialValues Valores iniciales del formulario
 * @param validationSchema Esquema de validación
 * @param onSubmit Función a ejecutar en el envío del formulario
 */
function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: ValidationSchema,
  onSubmit?: (values: T, errors: ValidationErrors) => void
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);

  // Validar formulario cuando cambian los valores
  useEffect(() => {
    if (validationSchema) {
      const validationErrors = validateForm(values, validationSchema);
      const hasErrors = Object.values(validationErrors).some(error => error !== null);
      
      setErrors(validationErrors);
      setIsValid(!hasErrors);
    } else {
      setIsValid(true);
    }
  }, [values, validationSchema]);

  // Manejar cambios en los campos
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<any>
  ) => {
    const { name, value, type } = e.target as any;
    
    // Manejar diferentes tipos de inputs
    if (type === 'checkbox') {
      setValues({
        ...values,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setValues({
        ...values,
        [name]: value
      });
    }
    
    // Marcar campo como tocado
    setTouched({
      ...touched,
      [name]: true
    });
  };

  // Establecer un valor directamente
  const setValue = (name: string, value: any) => {
    setValues({
      ...values,
      [name]: value
    });
    
    // Marcar campo como tocado
    setTouched({
      ...touched,
      [name]: true
    });
  };

  // Establecer múltiples valores a la vez
  const setMultipleValues = (newValues: Partial<T>) => {
    setValues({
      ...values,
      ...newValues
    });
    
    // Marcar campos como tocados
    const newTouched = { ...touched };
    Object.keys(newValues).forEach(key => {
      newTouched[key] = true;
    });
    
    setTouched(newTouched);
  };

  // Manejar evento blur (cuando un campo pierde el foco)
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | any
  ) => {
    const { name } = e.target;
    
    setTouched({
      ...touched,
      [name]: true
    });
  };

  // Manejar el envío del formulario
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Marcar todos los campos como tocados
    const allTouched: Record<string, boolean> = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Si hay un esquema de validación, validar el formulario
    if (validationSchema) {
      const validationErrors = validateForm(values, validationSchema);
      const hasErrors = Object.values(validationErrors).some(error => error !== null);
      
      setErrors(validationErrors);
      setIsValid(!hasErrors);
      
      // Si hay una función onSubmit, llamarla con los valores y errores
      if (onSubmit) {
        onSubmit(values, validationErrors);
      }
    } else if (onSubmit) {
      // Si no hay esquema de validación, llamar directamente a onSubmit
      onSubmit(values, {});
    }
    
    setIsSubmitting(false);
  };

  // Restablecer el formulario a sus valores iniciales
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  // Verificar si un campo tiene error y ha sido tocado
  const hasError = (fieldName: string) => {
    return errors[fieldName] !== null && errors[fieldName] !== undefined && touched[fieldName];
  };

  // Obtener el mensaje de error para un campo
  const getErrorMessage = (fieldName: string) => {
    return hasError(fieldName) ? errors[fieldName] : null;
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setMultipleValues,
    resetForm,
    hasError,
    getErrorMessage
  };
}

export default useForm;
