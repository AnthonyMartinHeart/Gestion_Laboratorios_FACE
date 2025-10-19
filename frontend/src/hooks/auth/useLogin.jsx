import { useState, useEffect } from 'react';

const useLogin = () => {
    const [errorRut, setErrorRut] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [inputData, setInputData] = useState({ rut: '', password: '' });
    const [prevRut, setPrevRut] = useState('');

    useEffect(() => {
        if (inputData.rut) setErrorRut('');
        if (inputData.password) setErrorPassword('');
    }, [inputData.rut, inputData.password]);

    const errorData = (dataMessage) => {
        if (dataMessage.dataInfo === 'rut') {
            setErrorRut(dataMessage.message);
        } else if (dataMessage.dataInfo === 'password') {
            setErrorPassword(dataMessage.message);
        }
    };

    const handleInputChange = (field, value) => {
        if (field === 'rut') {
            // Solo actualizar si el nuevo valor es válido o está vacío
            if (value === '' || /^[0-9.kK-]*$/.test(value)) {
                setPrevRut(value);
                setInputData(prevState => ({
                    ...prevState,
                    [field]: value
                }));
            } else {
                // Si el valor no es válido, mantener el valor anterior
                setInputData(prevState => ({
                    ...prevState,
                    [field]: prevRut
                }));
            }
        } else {
            setInputData(prevState => ({
                ...prevState,
                [field]: value
            }));
        }
    };

    return {
        errorRut,
        errorPassword,
        inputData,
        errorData,
        handleInputChange,
    };
};

export default useLogin;
