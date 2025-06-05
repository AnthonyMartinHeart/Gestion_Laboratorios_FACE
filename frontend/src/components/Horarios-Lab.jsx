import { useState } from "react";
import "@styles/Horarios.css";

const horas = [
  "08:10 -08:50", "08:50 -09:30", "09:40 -10:20", "10:20 -11:00",
  "11:10 -11:50", "11:50 -12:30", "12:40 -13:20", "13:20 -14:00",
  "14:10 -14:50", "14:50 -15:30", "15:40 -16:20", "16:20 -17:00",
  "17:10 -17:50", "17:50 -18:30", "18:40 -19:10", "19:20 -20:50",
  "20:50 -21:30"
];

const dias = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

function generarTablaInicial() {
  return horas.map(hora => [hora, ...Array(dias.length).fill("")]);
}

export default function HorarioLaboratorios() {
  const [lab1, setLab1] = useState(generarTablaInicial());
  const [lab2, setLab2] = useState(generarTablaInicial());
  const [lab3, setLab3] = useState(generarTablaInicial());

  const laboratorios = [
    { nombre: "CLASES LABORATORIO 1", data: lab1, setData: setLab1 },
    { nombre: "CLASES LABORATORIO 2", data: lab2, setData: setLab2 },
    { nombre: "CLASES LABORATORIO 3", data: lab3, setData: setLab3 }
  ];

  const handleCellChange = (labIndex, rowIndex, colIndex, value) => {
    const lab = laboratorios[labIndex];
    const newData = [...lab.data];
    newData[rowIndex][colIndex] = value;
    lab.setData(newData);
  };

  return (
    <div className="horario-container">
      <div className="space-y-12">
        {laboratorios.map((lab, labIndex) => (
          <div key={labIndex}>
            <h2 className="text-xl font-semibold mb-4 text-blue-800">{lab.nombre}</h2>
            <div className="overflow-x-auto">
              <table className="horario-table">
                <thead>
                  <tr>
                    <th>HORA</th>
                    {dias.map((dia, idx) => (
                      <th key={idx}>{dia}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lab.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex}>
                          {colIndex === 0 ? (
                            cell
                          ) : (
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) =>
                                handleCellChange(labIndex, rowIndex, colIndex, e.target.value)
                              }
                              className="editable-cell"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
