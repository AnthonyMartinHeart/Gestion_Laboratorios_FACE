import { useNavigate } from 'react-router-dom';
import { register } from '@services/auth.service.js';
import Form from "@components/Form";
import useRegister from '@hooks/auth/useRegister.jsx';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';
import { formatRut } from '@helpers/formatRut.js';
import '@styles/form.css';
import { useState } from 'react';

const Register = () => {
    const navigate = useNavigate();
    const {
        errorEmail,
        errorRut,
        errorData,
        handleInputChange
    } = useRegister();
    const [showAlumnoFields, setShowAlumnoFields] = useState(false);
    const [carrera, setCarrera] = useState('');
    const [anioIngreso, setAnioIngreso] = useState('');
    const [showOtroCarrera, setShowOtroCarrera] = useState(false);
    const [otroCarrera, setOtroCarrera] = useState('');
    const [rut, setRut] = useState('');
    const [rutError, setRutError] = useState('');
    const [currentEmail, setCurrentEmail] = useState('');

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



    // Función para validar RUT chileno
    const validateRut = (rut) => {
        if (!rut) return false;
        
        // Limpiar RUT
        const cleanRut = rut.replace(/[^0-9kK]/g, '');
        
        if (cleanRut.length < 2) return false;
        
        const body = cleanRut.slice(0, -1);
        const dv = cleanRut.slice(-1).toUpperCase();
        
        // Validar que el cuerpo sea numérico
        if (!/^\d+$/.test(body)) return false;
        
        // Validar rango del RUT (entre 1.000.000 y 99.999.999)
        const rutNumber = parseInt(body);
        if (rutNumber < 1000000 || rutNumber > 99999999) return false;
        
        // Calcular dígito verificador
        let sum = 0;
        let multiplier = 2;
        
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }
        
        const remainder = sum % 11;
        const calculatedDv = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
        
        return dv === calculatedDv;
    };

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

    // Manejador para el cambio del RUT
    const handleRutChange = (e) => {
        const inputValue = e.target.value;
        
        // Limitar a 12 caracteres máximo (xx.xxx.xxx-x)
        if (inputValue.length > 12) return;
        
        // Formatear automáticamente
        const formattedRut = formatRut(inputValue);
        setRut(formattedRut);
        
        // Validar solo si hay suficientes caracteres para un RUT completo
        if (formattedRut.length >= 9) {
            if (validateRut(formattedRut)) {
                setRutError('');
                // Notificar al hook de registro que el RUT es válido
                handleInputChange('rut', formattedRut);
            } else {
                setRutError('RUT inválido');
            }
        } else {
            setRutError('');
            // Limpiar el RUT en el hook si no es válido
            handleInputChange('rut', '');
        }
    };

    const handleCarreraChange = (e) => {
        const selectedCarrera = e.target.value;
        
        if (selectedCarrera === 'otro') {
            setShowOtroCarrera(true);
            setCarrera('');
            setOtroCarrera('');
        } else {
            setShowOtroCarrera(false);
            setCarrera(selectedCarrera);
            setOtroCarrera('');
        }
    };

    const handleOtroCarreraChange = (e) => {
        const textoCarrera = e.target.value;
        const abreviacion = abreviarCarrera(textoCarrera);
        setOtroCarrera(textoCarrera);
        setCarrera(abreviacion);
    };

    const handleEmailChange = (e) => {
        const email = e.target.value;
        setCurrentEmail(email);
        handleInputChange('email', email);
        
        // Solo mostrar campos de alumno para @alumnos.ubiobio.cl
        // Los @ubiobio.cl son profesores y no necesitan estos campos
        setShowAlumnoFields(/@alumnos\.ubiobio\.cl$/.test(email));
    };



    const registerSubmit = async (data) => {
        // Validar RUT antes de enviar
        if (!rut || !validateRut(rut)) {
            setRutError('Por favor ingresa un RUT válido');
            showErrorAlert('Error', 'Por favor ingresa un RUT válido.');
            return;
        }
        
        // Asegurar que el RUT formateado esté en los datos
        data.rut = rut;
        
        if (showAlumnoFields) {
            data.carrera = carrera;
            data.anioIngreso = anioIngreso;
        }
        try {
            const response = await register(data);
            if (response.status === 'Success') {
                showSuccessAlert('¡Registrado!', 'Usuario registrado exitosamente.');
                setTimeout(() => {
                    navigate('/auth');
                }, 3000);
            } else if (response.status === 'Client error') {
                errorData(response.details);
            }
        } catch (error) {
            console.error("Error al registrar un usuario: ", error);
            showErrorAlert('Cancelado', 'Ocurrió un error al registrarse.');
        }
    };

    return (
        <main className="container">
            <Form
                title="Crea tu cuenta"
                fields={[
                    {
                        label: "Nombre completo",
                        name: "nombreCompleto",
                        placeholder: "Nombre Completo",
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
                        placeholder: "@alumnos.ubiobio.cl / @ubiobio.cl",
                        fieldType: 'input',
                        type: "email",
                        required: true,
                        minLength: 15,
                        maxLength: 50,
                        pattern: /^[a-zA-Z0-9._%+-]+@(alumnos\.ubiobio\.cl|ubiobio\.cl)$/,
                        patternMessage: "Correo inválido. Solo se permiten dominios institucionales (@alumnos.ubiobio.cl y @ubiobio.cl)",
                        errorMessageData: errorEmail,
                        onChange: handleEmailChange,
                    },

                    {
                        label: "Rut",
                        name: "rut",
                        placeholder: "00.000.000-0",
                        fieldType: 'input',
                        type: "text",
                        minLength: 9,
                        maxLength: 12,
                        required: true,
                        value: rut,
                        errorMessageData: rutError || errorRut,
                        onChange: (e) => {
                            const formattedRut = formatRut(e.target.value);
                            handleRutChange({ target: { value: formattedRut } });
                            // Actualizar el valor del input directamente
                            e.target.value = formattedRut;
                        },
                    },
                    {
                        label: "Contraseña",
                        name: "password",
                        placeholder: "**********",
                        fieldType: 'input',
                        type: "password",
                        required: true,
                        minLength: 8,
                        maxLength: 26,
                        pattern: /^[a-zA-Z0-9]+$/,
                        patternMessage: "Debe contener solo letras y números",
                    },
                    ...(showAlumnoFields ? [
                        {
                            label: "Carrera",
                            name: "carrera",
                            fieldType: 'select',
                            required: !showOtroCarrera,
                            options: carreras,
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
                            placeholder: "2002",
                            fieldType: 'input',
                            type: 'text',
                            required: true,
                            maxLength: 4,
                            pattern: /^[0-9]{4}$/,
                            patternMessage: "Debe ser un año válido de 4 dígitos",
                            onChange: (e) => {
                                // Solo permitir números
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 4) {
                                    setAnioIngreso(value);
                                }
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
                                    
                                    return true;
                                }
                            }
                        }
                    ] : []),
                ]}
                buttonText="Registrarse"
                onSubmit={registerSubmit}
                footerContent={
                    <p>
                        ¿Ya tienes cuenta?, <a href="/auth">¡Inicia sesión aquí!</a>
                    </p>
                }
            />
        </main>
    );
};

export default Register;
