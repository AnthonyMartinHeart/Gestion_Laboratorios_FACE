import axios from "./http";

export async function login(rut, password) {
  try {
    const { data } = await axios.post("/auth/login", { rut, password });
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message:
        error.response?.data?.message ||
        "Error en la autenticación. Intente nuevamente.",
    };
  }
}

export async function register(payload) {
  try {
    const { data } = await axios.post("/auth/register", payload);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message:
        error.response?.data?.message ||
        "Error al registrarse. Revisa los datos ingresados.",
      errors: error.response?.data?.errors || null,
    };
  }
}
