import Form from './Form';
import '@styles/popup.css';
import CloseIcon from '@assets/XIcon.svg';
import QuestionIcon from '@assets/QuestionCircleIcon.svg';
import { useState } from 'react';

export default function Popup({ show, setShow, data, action }) {
    const userData = data && data.length > 0 ? data[0] : {};
    const [showOtroCarrera, setShowOtroCarrera] = useState(false);
    const [otroCarrera, setOtroCarrera] = useState('');

    const carreras = [
        { value: 'CPA', label: 'Contador Público y Auditor' },
        { value: 'ICO', label: 'Ingeniería Comercial' },
        { value: 'ICINF', label: 'Ingeniería Civil en Informática' },
        { value: 'IECI', label: 'Ingeniería de Ejecución en Computación e Informática' },
        { value: 'DRCH', label: 'Derecho' },
        { value: 'MG', label: 'Magister' },
        { value: 'PECE', label: 'PECE' },
        { value: 'otro', label: 'Otro' }
    ];

    // Función para abreviar carrera personalizada
    const abreviarCarrera = (texto) => {
        if (!texto) return '';
        
        // Convertir a mayúsculas y limpiar
        const textoLimpio = texto.toUpperCase().trim();
        
        // Dividir en palabras y tomar las iniciales
        const palabras = textoLimpio.split(/\s+/);
        
        if (palabras.length === 1) {
            // Si es una sola palabra, tomar las primeras 4 letras
            return palabras[0].substring(0, 4).toUpperCase();
        } else {
            // Si son múltiples palabras, tomar las iniciales (máximo 5)
            return palabras.slice(0, 5).map(palabra => palabra[0]).join('').toUpperCase();
        }
    };

    const handleCarreraChange = (e) => {
        const selectedCarrera = e.target.value;
        
        if (selectedCarrera === 'otro') {
            setShowOtroCarrera(true);
            setOtroCarrera('');
        } else {
            setShowOtroCarrera(false);
            setOtroCarrera('');
        }
    };

    const handleOtroCarreraChange = (e) => {
        const textoCarrera = e.target.value;
        setOtroCarrera(textoCarrera);
    };

    const handleSubmit = (formData) => {
        // Manejar carrera personalizada
        if (showOtroCarrera && otroCarrera) {
            formData.carrera = abreviarCarrera(otroCarrera);
        }
        
        // Asegura que 'activo' sea booleano si existe
        if (formData.hasOwnProperty('activo')) {
            if (formData.activo === 'true' || formData.activo === true) formData.activo = true;
            else if (formData.activo === 'false' || formData.activo === false) formData.activo = false;
        }
        action(formData);
    };

    const patternRut = new RegExp(/^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/);
    const isAlumno = userData.email && userData.email.endsWith('@alumnos.ubiobio.cl');
    return (
        <div>
            { show && (
            <div className="bg">
                <div className="popup">
                    <button className='close' onClick={() => setShow(false)}>
                        <img src={CloseIcon} />
                    </button>
                    <Form
                        title="Editar usuario"
                        fields={[
                            {
                                label: "Nombre completo",
                                name: "nombreCompleto",
                                defaultValue: userData.nombreCompleto || "",
                                placeholder: 'Nombre Completo',
                                fieldType: 'input',
                                type: "text",
                                required: true,
                                minLength: 15,
                                maxLength: 50,
                                pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                                patternMessage: "Debe contener solo letras y espacios",
                            },
                            {
                              label: "Correo electrónico",
                              name: "email",
                              defaultValue: userData.email || "",
                              placeholder: 'example@gmail.cl',
                              fieldType: 'input',
                              type: "email",
                              required: true,
                              disabled: true, // Campo deshabilitado
                              readOnly: true, // No permite escribir
                              minLength: 15,
                              maxLength: 50,
                              pattern: /^[\w.-]+@(gmail\.cl|alumnos\.ubiobio\.cl|ubiobio\.cl)$/,
                              patternMessage: "El correo debe ser @gmail.cl, @alumnos.ubiobio.cl o @ubiobio.cl",
                             },
                            {
                                label: "Rut",
                                name: "rut",
                                defaultValue: userData.rut || "",
                                placeholder: '21.308.770-3',
                                fieldType: 'input',
                                type: "text",
                                disabled: true, // Campo deshabilitado
                                readOnly: true, // No permite escribir
                                minLength: 9,
                                maxLength: 12,
                                pattern: patternRut,
                                patternMessage: "Debe ser xx.xxx.xxx-x o xxxxxxxx-x",
                                required: true,
                            },
                            {
                                label: "Rol",
                                name: "rol",
                                fieldType: 'select',
                                options: [
                                    { value: 'administrador', label: 'Administrador' },
                                    { value: 'usuario', label: 'Usuario' },
                                    { value: 'estudiante', label: 'Estudiante' },
                                    { value: 'consultor', label: 'Consultor' },
                                    { value: 'profesor', label: 'Profesor' },
                                ],
                                required: true,
                                defaultValue: userData.rol || "",
                            },
                            ...(isAlumno ? [
                                {
                                    label: "Carrera",
                                    name: "carrera",
                                    fieldType: 'select',
                                    options: carreras,
                                    required: !showOtroCarrera,
                                    defaultValue: userData.carrera || "",
                                    onChange: handleCarreraChange,
                                },
                                ...(showOtroCarrera ? [
                                    {
                                        label: "Especifica tu carrera",
                                        name: "otroCarrera",
                                        fieldType: 'input',
                                        type: 'text',
                                        placeholder: "Escribe tu carrera",
                                        required: true,
                                        maxLength: 50,
                                        value: otroCarrera,
                                        onChange: handleOtroCarreraChange,
                                    }
                                ] : []),
                                {
                                    label: "Año de ingreso",
                                    name: "anioIngreso",
                                    defaultValue: userData.anioIngreso || "",
                                    placeholder: '2002',
                                    fieldType: 'input',
                                    type: "text",
                                    required: true,
                                    maxLength: 4,
                                    pattern: /^[0-9]{4}$/,
                                    patternMessage: "Debe ser un año válido de 4 dígitos",
                                    onChange: (e) => {
                                        // Solo permitir números
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        return value.length <= 4 ? value : e.target.value.slice(0, 4);
                                    },
                                    validate: {
                                        validYear: (value) => {
                                            if (!value) return "El año de ingreso es obligatorio";
                                            
                                            const currentYear = new Date().getFullYear();
                                            const inputYear = parseInt(value);
                                            
                                            if (inputYear < 1950) {
                                                return "El año de ingreso no puede ser anterior a 1950";
                                            }
                                            if (inputYear > currentYear + 1) {
                                                return "El año de ingreso no puede ser mayor al año siguiente";
                                            }
                                            
                                            // Validar que no sea menor al año de egreso si existe
                                            const egresoYear = parseInt(userData.anioEgreso);
                                            if (egresoYear && !isNaN(egresoYear) && inputYear > egresoYear) {
                                                return "El año de ingreso no puede ser mayor al año de egreso";
                                            }
                                            
                                            return true;
                                        }
                                    }
                                },
                                {
                                    label: (
                                        <span>
                                            Año de egreso (opcional)
                                            <span className='tooltip-icon'>
                                                <img src={QuestionIcon} />
                                                <span className='tooltip-text'>Si se ingresa, la cuenta quedará inactiva. Puedes escribir "N/A" si no aplica</span>
                                            </span>
                                        </span>
                                    ),
                                    name: "anioEgreso",
                                    defaultValue: userData.anioEgreso || "",
                                    placeholder: '2024 o N/A',
                                    fieldType: 'input',
                                    type: "text",
                                    required: false,
                                    maxLength: 15,
                                    pattern: /^([0-9]{4}|N\/A|n\/a|No aplica|no aplica|Sin definir|sin definir)$/,
                                    patternMessage: "Debe ser un año válido de 4 dígitos o escribir 'N/A', 'No aplica', 'Sin definir'",
                                    onChange: (e) => {
                                        const value = e.target.value;
                                        // Permitir valores especiales o solo números
                                        const naValues = ['N/A', 'n/a', 'No aplica', 'no aplica', 'Sin definir', 'sin definir'];
                                        const isNAValue = naValues.some(naVal => value.toLowerCase().includes(naVal.toLowerCase()));
                                        
                                        if (isNAValue) {
                                            return value; // Permitir texto especial
                                        } else {
                                            // Solo permitir números y limitar a 4 dígitos
                                            const numericValue = value.replace(/[^0-9]/g, '');
                                            return numericValue.length <= 4 ? numericValue : numericValue.slice(0, 4);
                                        }
                                    },
                                    validate: {
                                        validYearOrNA: (value) => {
                                            if (!value) return true; // Campo opcional
                                            
                                            // Valores aceptados como "no aplica"
                                            const naValues = ['N/A', 'n/a', 'No aplica', 'no aplica', 'Sin definir', 'sin definir'];
                                            if (naValues.includes(value)) return true;
                                            
                                            // Si es un año, validar lógica
                                            if (/^[0-9]{4}$/.test(value)) {
                                                const currentYear = new Date().getFullYear();
                                                const inputYear = parseInt(value);
                                                const ingresoYear = parseInt(userData.anioIngreso);
                                                
                                                if (inputYear < 1950) {
                                                    return "El año de egreso no puede ser anterior a 1950";
                                                }
                                                if (inputYear > currentYear + 10) {
                                                    return "El año de egreso no puede ser muy lejano al futuro";
                                                }
                                                if (ingresoYear && inputYear < ingresoYear) {
                                                    return "El año de egreso no puede ser menor al año de ingreso";
                                                }
                                                return true;
                                            }
                                            
                                            return "Debe ser un año válido de 4 dígitos o escribir 'N/A', 'No aplica', 'Sin definir'";
                                        }
                                    }
                                },
                            ] : []),
                            {
                                label: (
                                    <span>
                                        Nueva Contraseña
                                        <span className='tooltip-icon'>
                                            <img src={QuestionIcon} />
                                            <span className='tooltip-text'>Este campo es opcional. Solo completa si deseas cambiar la contraseña</span>
                                        </span>
                                    </span>
                                ),
                                name: "newPassword",
                                placeholder: "**********",
                                fieldType: 'input',
                                type: "password",
                                required: false,
                                minLength: 8,
                                maxLength: 26,
                                pattern: /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/,
                                patternMessage: "Debe contener al menos una letra y un número, solo letras y números permitidos",
                                validate: {
                                    strongPassword: (value) => {
                                        if (!value) return true; // Campo opcional
                                        if (value.length < 8) return "Debe tener al menos 8 caracteres";
                                        if (!/[a-zA-Z]/.test(value)) return "Debe contener al menos una letra";
                                        if (!/[0-9]/.test(value)) return "Debe contener al menos un número";
                                        return true;
                                    }
                                }
                            },
                            ...(isAlumno ? [
                                {
                                    label: (
                                        <span>
                                            Estado de la cuenta
                                            <span className='tooltip-icon'>
                                                <img src={QuestionIcon} />
                                                <span className='tooltip-text'>Puedes activar o desactivar la cuenta manualmente</span>
                                            </span>
                                        </span>
                                    ),
                                    name: "activo",
                                    fieldType: 'select',
                                    options: [
                                        { value: true, label: 'Activa' },
                                        { value: false, label: 'Inactiva' }
                                    ],
                                    required: true,
                                    defaultValue: userData.activo === false ? false : true,
                                }
                            ] : []),
                        ]}
                        onSubmit={handleSubmit}
                        buttonText="Editar usuario"
                        backgroundColor={'#fff'}
                    />
                </div>
            </div>
            )}
        </div>
    );
}
