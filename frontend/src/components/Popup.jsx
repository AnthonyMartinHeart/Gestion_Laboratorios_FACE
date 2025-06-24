import Form from './Form';
import '@styles/popup.css';
import CloseIcon from '@assets/XIcon.svg';
import QuestionIcon from '@assets/QuestionCircleIcon.svg';

export default function Popup({ show, setShow, data, action }) {
    const userData = data && data.length > 0 ? data[0] : {};

    const handleSubmit = (formData) => {
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
                                    { value: 'consultor', label: 'Consultor' },
                                ],
                                required: true,
                                defaultValue: userData.rol || "",
                            },
                            ...(isAlumno ? [
                                {
                                    label: "Carrera",
                                    name: "carrera",
                                    defaultValue: userData.carrera || "",
                                    placeholder: 'Carrera',
                                    fieldType: 'input',
                                    type: "text",
                                    required: false,
                                    maxLength: 100,
                                },
                                {
                                    label: "Año de ingreso",
                                    name: "anioIngreso",
                                    defaultValue: userData.anioIngreso || "",
                                    placeholder: 'Año de ingreso',
                                    fieldType: 'input',
                                    type: "text",
                                    required: false,
                                    maxLength: 10,
                                },
                                {
                                    label: (
                                        <span>
                                            Año de egreso (opcional)
                                            <span className='tooltip-icon'>
                                                <img src={QuestionIcon} />
                                                <span className='tooltip-text'>Si se ingresa, la cuenta quedará inactiva</span>
                                            </span>
                                        </span>
                                    ),
                                    name: "anioEgreso",
                                    defaultValue: userData.anioEgreso || "",
                                    placeholder: 'Año de egreso',
                                    fieldType: 'input',
                                    type: "text",
                                    required: false,
                                    maxLength: 10,
                                },
                            ] : []),
                            {
                                label: (
                                    <span>
                                        Ingresar Contraseña
                                        <span className='tooltip-icon'>
                                            <img src={QuestionIcon} />
                                            <span className='tooltip-text'>Este campo es opcional</span>
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
                                pattern: /^[a-zA-Z0-9]+$/,
                                patternMessage: "Debe contener solo letras y números",
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
