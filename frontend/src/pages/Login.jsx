import { useNavigate } from 'react-router-dom';
import { login } from '@services/auth.service.js';
import Form from '@components/Form';
import useLogin from '@hooks/auth/useLogin.jsx';
import logoImage from '@assets/GL-BLUE.png'; 
import '@styles/form.css';
import { showErrorAlert } from '@helpers/sweetAlert.js';
import { formatRut } from '@helpers/formatRut.js';

const Login = () => {
    const navigate = useNavigate();
    const {
        errorRut,
        errorPassword,
        errorData,
        handleInputChange
    } = useLogin();

    const loginSubmit = async (data) => {
        try {
            const response = await login(data);
            if (response.status === 'Success') {
                navigate('/home');
            } else if (response.status === 'Client error') {
                // Forzar SweetAlert si el mensaje incluye "desactivada"
                const details = response.details;
                if ((typeof details === 'object' && details.dataInfo === 'activo') ||
                    (typeof details === 'object' && details.message && details.message.toLowerCase().includes('desactivada')) ||
                    (typeof details === 'string' && details.toLowerCase().includes('desactivada'))
                ) {
                    showErrorAlert('Cuenta desactivada', 'Tu cuenta está desactivada. Contacta al administrador.');
                } else {
                    errorData(response.details);
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <main className="container">
            <Form
                logo={<img src={logoImage} alt="Logo GL-BLUE" className="form-logo-img" />}
                title="Iniciar sesión"
                fields={[
                    {
                        label: "RUT",
                        name: "rut",
                        placeholder: "12.345.678-9",
                        fieldType: 'input',
                        type: "text",
                        required: true,
                        minLength: 9,
                        maxLength: 12,
                        errorMessageData: errorRut,
                        pattern: /^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/,
                        patternMessage: "Formato rut inválido, debe ser xx.xxx.xxx-x o xxxxxxxx-x",
                        onChange: (e) => {
                            const formattedRut = formatRut(e.target.value);
                            handleInputChange('rut', formattedRut);
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
                        errorMessageData: errorPassword,
                        onChange: (e) => handleInputChange('password', e.target.value)
                    },
                ]}
                buttonText="Iniciar sesión"
                onSubmit={loginSubmit}
                footerContent={
                    <p>
                        ¿No tienes cuenta?, <a href="/register">¡Regístrate aquí!</a>
                    </p>
                }
            />
        </main>
    );
};

export default Login;
