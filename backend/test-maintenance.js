// Script de prueba para validar reservas de mantenimiento
import { reservationValidation } from "./src/validations/reservation.validation.js";

const maintenanceData = {
  rut: '00.000.000-0',
  carrera: 'MAINTENANCE',
  horaInicio: '00:00',
  horaTermino: '23:59',
  labId: 1,
  pcId: 5
};

console.log('Probando validación de datos de mantenimiento...');
console.log('Datos:', maintenanceData);

const { error, value } = reservationValidation.validate(maintenanceData);

if (error) {
  console.log('❌ Error de validación:', error.message);
} else {
  console.log('✅ Validación exitosa:', value);
}
