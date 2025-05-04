const horas = [
    "08:10 - 08:50", "08:50 - 09:30", "09:40 - 10:20", "10:20 - 11:00",
    "11:10 - 11:50", "11:50 - 12:30", "12:40 - 13:20", "13:20 - 14:00",
    "14:10 - 14:50", "14:50 - 15:30", "15:40 - 16:20", "16:20 - 17:00",
    "17:10 - 17:50", "17:50 - 18:30", "18:40 - 19:20", "19:20 - 20:00",
    "20:00 - 20:50"
  ];
  
  const BitacoraTable = ({ numEquipos, startIndex = 1 }) => {
    return (
      <div className="bitacora-table">
        <table>
          <thead>
            <tr>
              <th>Horario</th>
              {Array.from({ length: numEquipos }, (_, i) => (
                <th key={i}>PC {startIndex + i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horas.map((hora, index) => (
              <tr key={index}>
                <td>{hora}</td>
                {Array.from({ length: numEquipos }, (_, i) => (
                  <td key={i}></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default BitacoraTable;
  