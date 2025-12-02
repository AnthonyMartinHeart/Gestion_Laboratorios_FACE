import React from "react";
import { createRoot } from "react-dom/client";

// DEBUG global: muestra errores que normalmente quedarían “silenciosos”
window.addEventListener("error", (e) => {
  console.error("[renderer:error]", e.error || e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[renderer:unhandledrejection]", e.reason);
});

function SafeApp() {
  // Carga App de forma segura para detectar errores de import
  const App = require("./App").default; // soporta app.jsx o App.jsx
  return <App />;
}

const el = document.getElementById("root");
if (!el) {
  document.body.innerHTML = `
    <div style="padding:16px;font-family:sans-serif;color:#222">
      <h2>Falta el contenedor #root</h2>
      <p>Confirma que index.html tenga: &lt;div id="root"&gt;&lt;/div&gt;</p>
    </div>`;
} else {
  const root = createRoot(el);
  root.render(<SafeApp />);
}
