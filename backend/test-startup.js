// Script de prueba para verificar que el backend puede arrancar
import { connectDB } from "./src/config/configDb.js";

console.log("🚀 Probando conexión a la base de datos...");

try {
  await connectDB();
  console.log("✅ Conexión exitosa a la base de datos");
  
  // Probar que se pueda importar la entidad de solicitudes
  const { AppDataSource } = await import("./src/config/configDb.js");
  const SolicitudEntity = await import("./src/entity/solicitud.entity.js");
  
  console.log("✅ Entidad de solicitudes importada correctamente");
  
  // Verificar que TypeORM reconoce la entidad
  const solicitudRepository = AppDataSource.getRepository("Solicitud");
  console.log("✅ Repository de solicitudes creado correctamente");
  
  console.log("🎉 Todas las verificaciones pasaron. El backend debería funcionar correctamente.");
  process.exit(0);
  
} catch (error) {
  console.error("❌ Error durante la verificación:", error);
  process.exit(1);
}
