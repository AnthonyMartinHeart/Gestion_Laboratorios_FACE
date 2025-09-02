import { useNavigate } from 'react-router-dom';
import { login } from '@services/auth.service.js';
import Form from '@components/Form';
import useLogin from '@hooks/auth/useLogin.jsx';
import logoImage from '@assets/GL-BLUE.png'; 
import '@styles/form.css';
import { showErrorAlert } from '@helpers/sweetAlert.js';

const Login = () => {
    const navigate = useNavigate();
    const {
        errorEmail,
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
                        label: "Correo electrónico",
                        name: "email",
                        placeholder: "example@gmail.cl",
                        fieldType: 'input',
                        type: "email",
                        required: true,
                        minLength: 15,
                        maxLength: 50,
                        errorMessageData: errorEmail,
                        validate: {
                            emailDomain: (value) =>
                                value.endsWith('@gmail.cl') || 
                                value.endsWith('@alumnos.ubiobio.cl') || 
                                value.endsWith('@ubiobio.cl') || 
                                'El correo debe terminar en @gmail.cl, @alumnos.ubiobio.cl o @ubiobio.cl'
                        },
                        onChange: (e) => handleInputChange('email', e.target.value),
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
