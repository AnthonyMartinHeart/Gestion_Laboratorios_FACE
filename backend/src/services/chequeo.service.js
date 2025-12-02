"use strict";
import { AppDataSource } from "../config/configDb.js";


export async function checkHealthService() {
  let dbStatus = "down";

  try {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.query("SELECT 1");
      dbStatus = "up";
    } else {
      dbStatus = "not_initialized";
    }
  } catch (e) {
    dbStatus = "down";
  }

  return {
    ok: true,
    db: dbStatus,
    time: new Date().toISOString(),
  };
}
