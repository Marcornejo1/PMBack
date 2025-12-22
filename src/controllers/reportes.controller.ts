import controllerProps from "./interfaces";
import connectDB from "../model/dbConnection.model";
import { NVarChar, Date, UniqueIdentifier } from "mssql";

const numeroCoincidencias = 3;

const reportesController: controllerProps = {
  //Obtenemos reportes
  readDash: async (_, res) => {
    try {
      //Query para obtener estadísticas del dashboard
      const query = `
        SELECT
          COUNT(*) as totalReportes,
          SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) as reportesCompletados,
          SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as reportesPendientes,
          SUM(CASE WHEN YEAR(fechaCreacion) = YEAR(GETDATE()) AND MONTH(fechaCreacion) = MONTH(GETDATE()) THEN 1 ELSE 0 END) as reportesMesActual
        FROM reportes
      `;
      //Conectamos a la base de datos
      const pool = await connectDB();
      const result = await pool.request().query(query);

      console.log(result);
      
      //Enviamos la respuesta
      res.send(result);

    } catch (error: any) {
      console.error("Error al obtener estadísticas del dashboard:", error);
      res.status(500).send({ type: "fatal", message: "Error al obtener estadísticas del dashboard" });
    }
  },

  /*
  // CONSULTAS COMENTADAS PARA REPORTES RECIENTES Y BORRADORES
  // Descomentar cuando se implementen en el frontend

  //Obtener reportes recientes (últimos 5)
  readReportesRecientes: async (_, res) => {
    try {
      const pool = await connectDB();

      const query = `
        SELECT TOP 5
          CAST(idReporte AS NVARCHAR(36)) as id,
          cliente,
          CONVERT(VARCHAR(10), fechaCreacion, 103) as fecha,
          tipo,
          estado
        FROM reportes
        ORDER BY fechaCreacion DESC
      `;

      const result = await pool.request().query(query);
      res.send(result.recordset);

    } catch (error: any) {
      console.error("Error al obtener reportes recientes:", error);
      res.status(500).send({ type: "fatal", message: "Error al obtener reportes recientes" });
    }
  },

  //Obtener borradores pendientes
  readBorradores: async (_, res) => {
    try {
      const pool = await connectDB();

      const query = `
        SELECT
          CAST(idReporte AS NVARCHAR(36)) as id,
          cliente,
          CONVERT(VARCHAR(19), fechaCreacion, 120) as fechaGuardado,
          0 as porcentajeCompletado  -- Campo calculado, implementar lógica según necesidad
        FROM reportes
        WHERE estado = 'Borrador'
        ORDER BY fechaCreacion DESC
      `;

      const result = await pool.request().query(query);
      res.send(result.recordset);

    } catch (error: any) {
      console.error("Error al obtener borradores:", error);
      res.status(500).send({ type: "fatal", message: "Error al obtener borradores" });
    }
  },
  */
};

export default reportesController;