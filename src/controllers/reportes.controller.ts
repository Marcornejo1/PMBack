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
          ISNULL(COUNT(*), 0) as totalReportes,
          ISNULL(SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END), 0) as reportesCompletados,
          ISNULL(SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END), 0) as reportesPendientes,
          ISNULL(SUM(CASE WHEN YEAR(fechaCreacion) = YEAR(GETDATE()) AND MONTH(fechaCreacion) = MONTH(GETDATE()) THEN 1 ELSE 0 END), 0) as reportesMesActual
        FROM reportes
      `;
      //Conectamos a la base de datos
      const pool = await connectDB();
      const result = await pool.request().query(query);

      console.log(result.recordset[0]);
      
      //Enviamos la respuesta
      res.send(result.recordset[0]);

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
          CAST(ISNULL(idReporte, '00000000-0000-0000-0000-000000000000') AS NVARCHAR(36)) as id,
          ISNULL(cliente, '') as cliente,
          CONVERT(VARCHAR(10), ISNULL(fechaCreacion, GETDATE()), 103) as fecha,
          ISNULL(tipo, '') as tipo,
          ISNULL(estado, '') as estado
        FROM reportes
        ORDER BY ISNULL(fechaCreacion, GETDATE()) DESC
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
          CAST(ISNULL(idReporte, '00000000-0000-0000-0000-000000000000') AS NVARCHAR(36)) as id,
          ISNULL(cliente, '') as cliente,
          CONVERT(VARCHAR(19), ISNULL(fechaCreacion, GETDATE()), 120) as fechaGuardado,
          ISNULL(0, 0) as porcentajeCompletado
        FROM reportes
        WHERE ISNULL(estado, '') = 'Borrador'
        ORDER BY ISNULL(fechaCreacion, GETDATE()) DESC
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