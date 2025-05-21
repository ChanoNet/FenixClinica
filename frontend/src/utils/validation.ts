/**
 * Utilidades para validación de formularios
 */

// Tipo para reglas de validación
type ValidationRule = {
  validator: (value: any, formValues?: any) => boolean;
  message: string;
};

// Tipo para el esquema de validación
export type ValidationSchema = {
  [field: string]: ValidationRule[];
};

// Tipo para errores de validación
export type ValidationErrors = {
  [field: string]: string | null;
};

/**
 * Valida un formulario según un esquema de validación
 * @param values Valores del formulario
 * @param schema Esquema de validación
 * @returns Objeto con errores de validación
 */
export const validateForm = (values: any, schema: ValidationSchema): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Recorrer cada campo en el esquema
  Object.entries(schema).forEach(([field, rules]) => {
    // Verificar cada regla para el campo
    for (const rule of rules) {
      // Si el valor no pasa la validación
      if (!rule.validator(values[field], values)) {
        errors[field] = rule.message;
        break; // Salir al primer error en este campo
      }
    }

    // Si no hay errores, establecer explícitamente como null
    if (!errors[field]) {
      errors[field] = null;
    }
  });

  return errors;
};

// Reglas de validación comunes
export const validationRules = {
  // Verificar que un campo no esté vacío
  required: (message = 'Este campo es obligatorio'): ValidationRule => ({
    validator: (value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    },
    message
  }),

  // Verificar longitud mínima
  minLength: (length: number, message?: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true; // Skip if empty (use required rule for that)
      return value.length >= length;
    },
    message: message || `Debe tener al menos ${length} caracteres`
  }),

  // Verificar longitud máxima
  maxLength: (length: number, message?: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      return value.length <= length;
    },
    message: message || `Debe tener como máximo ${length} caracteres`
  }),

  // Validar formato de email
  email: (message = 'Debe ser un email válido'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(value);
    },
    message
  }),

  // Validar coincidencia con otro campo (ej: confirmar contraseña)
  matches: (fieldName: string, message?: string): ValidationRule => ({
    validator: (value, formValues) => value === formValues[fieldName],
    message: message || `Debe coincidir con el campo ${fieldName}`
  }),

  // Validar que sea un número
  isNumber: (message = 'Debe ser un número'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      return !isNaN(Number(value));
    },
    message
  }),

  // Validar que sea una fecha válida
  isDate: (message = 'Debe ser una fecha válida'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message
  }),

  // Validar fecha futura
  isFutureDate: (message = 'Debe ser una fecha futura'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      return date > now;
    },
    message
  }),

  // Validar número mínimo
  min: (min: number, message?: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      return Number(value) >= min;
    },
    message: message || `Debe ser mayor o igual a ${min}`
  }),

  // Validar número máximo
  max: (max: number, message?: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      return Number(value) <= max;
    },
    message: message || `Debe ser menor o igual a ${max}`
  }),

  // Validar expresión regular personalizada
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      return regex.test(value);
    },
    message
  }),

  // Validar que un campo tenga un valor específico
  equals: (compareValue: any, message?: string): ValidationRule => ({
    validator: (value) => value === compareValue,
    message: message || `Debe ser igual a ${compareValue}`
  })
};

/**
 * Ejemplo de uso:
 * 
 * // Definir esquema de validación
 * const loginSchema: ValidationSchema = {
 *   email: [validationRules.required(), validationRules.email()],
 *   password: [validationRules.required(), validationRules.minLength(8)]
 * };
 * 
 * // Validar formulario
 * const errors = validateForm(formData, loginSchema);
 *
 * // Verificar si hay errores
 * const hasErrors = Object.values(errors).some(error => error !== null);
 */
