import React from "react";
import { createRoot } from "react-dom/client";
import LoginForm from "./components/LoginForm";
import "./styles/base.css";

function App() {
  return <LoginForm />;
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
