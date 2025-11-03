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
