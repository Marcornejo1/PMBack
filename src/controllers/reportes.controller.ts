import controllerProps from "./interfaces";
import connectDB from "../model/dbConnection.model";
import { NVarChar, Date, UniqueIdentifier } from "mssql";
import { MAYUS_REG_EX } from "../const/regex";

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

  //Encontrar coincidencias por número de serie
  findMatch: async (req, res) => {
    //obtenemos parametros de busqueda
    const { numeroSerie } = req.query;

    //Validamos datos y el tipo de dato
    if (!numeroSerie)
      return res.status(400).send({ type: "warning", message: "Faltan datos por completar" });

    if (typeof numeroSerie !== "string")
      return res.status(400).send({ type: "warning", message: "Dato ingresado no válido" });

    //Validamos que la cadena no esté vacía y que no sea solo espacios
    if (numeroSerie.trim().length < 1)
      return res.status(400).send({ type: "warning", message: "Faltan datos por completar" });

    //Validamos que cumplan las expresiones regulares
    if (!MAYUS_REG_EX.test(numeroSerie))
      return res.status(400).send({ type: "warning", message: "Datos ingresados no válidos" });

    //Verificamos si ya esta registrado el número de serie
    try {
      //Creamos el query
      const queryBusquedaIndividual = `
        SELECT COUNT(1) AS count
        FROM equipos
        WHERE nSerie = @numeroSerie`;

      //Se realiza la conexión
      const pool = await connectDB();

      //Se envia el query y escapamos los datos para evitar inyecciones SQL
      //Se limpian las entradas para evitar espacios al inicio y final
      const resultBusquedaIndividual = await pool.request().input("numeroSerie", NVarChar, numeroSerie.trim()).query(queryBusquedaIndividual);
      //Validamos si el resultado se encuentra
      const count = resultBusquedaIndividual.recordset[0].count;

      //Si se encuentra un registro igual se acaba el proceso y enviamos un mensaje de aviso
      if (count > 0)
        return res.status(202).send({ type: "warning", message: "Registro duplicado" });

      return res.send("No se encontraron coincidencias");
    } catch (error){
      console.error("Error al buscar coincidencias", error);
      res.status(500).send({ type: "fatal", message: "Error al buscar coincidencias" });
    }

  },

  create: async (req, res) => {
    //Obtenemos los parametros con body, que da el cuerpo de la solicitud http
    const { /* Parametros */ } = req.body;

  }

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