import controllerProps from "./interfaces";
import connectDB from "../model/dbConnection.model";
import { Bit, Request, NVarChar, Date, UniqueIdentifier, Transaction, Int, Decimal } from "mssql";
import { MAYUS_REG_EX } from "../const/regex";

const numeroCoincidencias = 3;

const reportesController: controllerProps = {
  //Obtenemos reportes
  readDash: async (_, res) => {
    try {
      //Conectamos a la base de datos
      const pool = await connectDB();
      const transaction = new Transaction(pool);

      try {
        await transaction.begin();

        //Inicializamos el request para realizar consultas dentro de la transacción
        const request = new Request(transaction);

        //Query para obtener estadísticas del dashboard
        const queryEstadisticas = `
          SELECT
            ISNULL(COUNT(*), 0) as totalReportes,
            ISNULL(SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END), 0) as reportesCompletados,
            ISNULL(SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END), 0) as reportesPendientes,
            ISNULL(SUM(CASE WHEN YEAR(fechaCreacion) = YEAR(GETDATE()) AND MONTH(fechaCreacion) = MONTH(GETDATE()) THEN 1 ELSE 0 END), 0) as reportesMesActual
          FROM reportes
        `;

        //Query para obtener reportes recientes (últimos 5)
        const queryReportesRecientes = `
          SELECT TOP 5
            CAST(ISNULL(idReporte, '00000000-0000-0000-0000-000000000000') AS NVARCHAR(36)) as id,
            ISNULL(cliente, '') as cliente,
            CONVERT(VARCHAR(10), ISNULL(fechaCreacion, GETDATE()), 103) as fecha,
            ISNULL(tipo, '') as tipo,
            ISNULL(estado, '') as estado
          FROM reportes
          ORDER BY ISNULL(fechaCreacion, GETDATE()) DESC
        `;

        //Query para obtener borradores
        const queryBorradores = `
          SELECT
            CAST(ISNULL(idReporte, '00000000-0000-0000-0000-000000000000') AS NVARCHAR(36)) as id,
            ISNULL(cliente, '') as cliente,
            CONVERT(VARCHAR(19), ISNULL(fechaCreacion, GETDATE()), 120) as fechaGuardado,
            ISNULL(0, 0) as porcentajeCompletado
          FROM reportes
          WHERE ISNULL(estado, '') = 'Borrador'
          ORDER BY ISNULL(fechaCreacion, GETDATE()) DESC
        `;

        //Ejecutamos todas las consultas
        const estadisticasResult = await request.query(queryEstadisticas);
        const recientesResult = await request.query(queryReportesRecientes);
        const borradoresResult = await request.query(queryBorradores);

        //Confirmar la transacción
        await transaction.commit();

        //Preparamos la respuesta con todas las consultas
        const response = {
          estadisticas: estadisticasResult.recordset[0],
          reportesRecientes: recientesResult.recordset,
          borradores: borradoresResult.recordset
        };

        console.log(response);

        //Enviamos la respuesta
        res.send(response);

      } catch (error) {
        //Si hay error, hacemos rollback
        await transaction.rollback();
        console.error("Error al obtener datos del dashboard:", error);
        res.status(500).send({ type: "fatal", message: "Error al obtener datos del dashboard" });
      }
    } catch (error: any) {
      console.error("Error al obtener datos del dashboard:", error);
      res.status(500).send({ type: "fatal", message: "Error al obtener datos del dashboard" });
    }
  },

  //Encontrar coincidencias por número de serie
  findMatch: async (req, res) => {
    //obtenemos parametros de busqueda
    const { numeroSerie } = req.query;
    console.log(numeroSerie);



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
    } catch (error) {
      console.error("Error al buscar coincidencias", error);
      res.status(500).send({ type: "fatal", message: "Error al buscar coincidencias" });
    }

  },

  create: async (req, res) => {
    //Obtenemos los parametros con body, que da el cuerpo de la solicitud http
    const { data, estado, usuarioCreador } = req.body;
    const { cliente, direccion, ciudad, encargado, marca, modelo, nSerie, referenciaImages, tipo, EnFFAB, EnFFBC, EnFFCA, EnFNAN, EnFNBN, ENFNCN, CorrA, CorrB, CorrC, SalFFAB, SalFFBC, SalFFCA, SalFNAN, SalFNBN, SalFNCN, CorrSalidaA, CorrSalidaB, CorrSalidaC, FrecEntr, FrecSalid, PorCarga, TenBateria, CorrBateria, TempUPS, ModeloBateria, CantBaterias, AñoFabricacionBaterias, Observaciones, nombreRealizo, nombreRecibio, fechaRealizado, fechaRecibido } = data;
    console.log(cliente, direccion, ciudad, encargado, marca, modelo, nSerie, tipo, referenciaImages, EnFFAB, EnFFBC, EnFFCA, EnFNAN, EnFNBN, ENFNCN, CorrA, CorrB, CorrC, SalFFAB, SalFFBC, SalFFCA, SalFNAN, SalFNBN, SalFNCN, CorrSalidaA, CorrSalidaB, CorrSalidaC, FrecEntr, FrecSalid, PorCarga, TenBateria, CorrBateria, TempUPS, ModeloBateria, CantBaterias, AñoFabricacionBaterias, Observaciones, nombreRealizo, nombreRecibio, fechaRealizado, fechaRecibido, estado, usuarioCreador);

    //Validamos que todos los datos obligatorios hayan sido enviados
    if (!cliente || !direccion || !ciudad || !encargado || !marca || !modelo || !nSerie || !tipo || !EnFFAB || !EnFFBC || !EnFFCA || !EnFNAN || !EnFNBN || !ENFNCN || !CorrA || !CorrB || !CorrC || !SalFFAB || !SalFFBC || !SalFFCA || !SalFNAN || !SalFNBN || !SalFNCN || !CorrSalidaA || !CorrSalidaB || !CorrSalidaC || !FrecEntr || !FrecSalid || !PorCarga || !TenBateria || !CorrBateria || !TempUPS || !ModeloBateria || !CantBaterias || !AñoFabricacionBaterias)
      return res.status(400).send({ type: "warning", message: "Faltan datos por completar1" });

    //Validamos el tipo de dato de los parametros
    if (typeof cliente !== 'string' || typeof direccion !== 'string' || typeof ciudad !== 'string' || typeof encargado !== 'string' || typeof marca !== 'string' || typeof modelo !== 'string' || typeof nSerie !== 'string' || typeof tipo !== 'string' || typeof EnFFAB !== 'string' || typeof EnFFBC !== 'string' || typeof EnFFCA !== 'string' || typeof EnFNAN !== 'string' || typeof EnFNBN !== 'string' || typeof ENFNCN !== 'string' || typeof CorrA !== 'string' || typeof CorrB !== 'string' || typeof CorrC !== 'string' || typeof SalFFAB !== 'string' || typeof SalFFBC !== 'string' || typeof SalFFCA !== 'string' || typeof SalFNAN !== 'string' || typeof SalFNBN !== 'string' || typeof SalFNCN !== 'string' || typeof CorrSalidaA !== 'string' || typeof CorrSalidaB !== 'string' || typeof CorrSalidaC !== 'string' || typeof FrecEntr !== 'string' || typeof FrecSalid !== 'string' || typeof PorCarga !== 'string' || typeof TenBateria !== 'string' || typeof CorrBateria !== 'string' || typeof TempUPS !== 'string' || typeof ModeloBateria !== 'string' || typeof CantBaterias !== 'string' || typeof AñoFabricacionBaterias !== 'string' || typeof Observaciones !== 'string' || typeof nombreRealizo !== 'string' || typeof nombreRecibio !== 'string' || typeof fechaRealizado !== 'string' || typeof fechaRecibido !== 'string')
      return res.status(400).send({ type: "warning", message: "Datos ingresados no válidos" });

    //Para este proceso tendremos que usar un doble try catch para manejar errores 
    try {
      //Como se van a insertar datos en varias tablas, usaremos transacciones
      const pool = await connectDB();
      const transaction = new Transaction(pool);

      try {
        await transaction.begin();

        //Inicializamos el request para realizar consultas dentro de la transacción
        const request = new Request(transaction);

        const queryInsertReporte = `
        INSERT INTO reportes(cliente, 
          direccion, 
          ciudad, 
          encargado, 
          tipo, 
          estado, 
          observaciones, 
          nombreRealizo, 
          nombreRecibio, 
          usuarioCreador, 
          fechaRealizo, 
          fechaRecibio
          ) OUTPUT INSERTED.idReporte VALUES (
              @cliente, 
              @direccion, 
              @ciudad, 
              @encargado, 
              @tipo, 
              @estado, 
              @observaciones, 
              @nombreRealizo, 
              @nombreRecibio, 
              @usuarioCreador, 
              @fechaRealizo, 
              @fechaRecibio
          )`;

        //Enviamos el query y escapamos los datos para evitar inyecciones SQL
        //Limpiamos las entradas para evitar espacios al inicio y final
        const insertReporteResponse = await request
          .input("cliente", NVarChar, cliente.trim())
          .input("direccion", NVarChar, direccion.trim())
          .input("ciudad", NVarChar, ciudad.trim())
          .input("encargado", NVarChar, encargado.trim())
          .input("tipo", NVarChar, tipo.trim())
          .input("estado", NVarChar, estado.trim())
          .input("observaciones", NVarChar, Observaciones.trim())
          .input("nombreRealizo", NVarChar, nombreRealizo.trim())
          .input("nombreRecibio", NVarChar, nombreRecibio.trim())
          .input("usuarioCreador", NVarChar, usuarioCreador.trim() || "UsuarioPrueba") //Temporal hasta que se implemente el sistema de usuarios
          .input("fechaRealizo", Date, fechaRealizado || null)
          .input("fechaRecibio", Date, fechaRecibido || null)
          .query(queryInsertReporte);

        //Obtenemos el id del reporte insertado
        const idReporte = insertReporteResponse.recordset[0].idReporte;

        //Validamos que regrese un id válido
        if (!idReporte) {
          await transaction.rollback();
          return res.status(404).send({ type: "fatal", message: "No se recupero el id del reporte creado" });
        }

        //Preparamos nuevo request para insertar en la tabla de equipos
        const requestEquipo = new Request(transaction);

        const queryInsertEquipo = `
          INSERT INTO equipos(
          idReporte,
          marca,
          modelo,
          nSerie,
          modeloBateria,
          cantidadBaterias,
          anioFabricacionBaterias
          ) OUTPUT INSERTED.idEquipo VALUES(
           @idReporte,
           @marca,
           @modelo,
           @nSerie,
           @modeloBateria,
           @cantBaterias,
           @añoFabricacionBaterias
            )`;

        //Enviamos el query y escapamos los datos para evitar inyecciones
        //Limpiamos entradas para evitar espacios con .trim
        const inserEquipoResponse = await requestEquipo
          .input("idReporte", UniqueIdentifier, idReporte)
          .input("marca", NVarChar, marca.trim())
          .input("modelo", NVarChar, modelo.trim())
          .input("nSerie", NVarChar, nSerie.trim())
          .input("modeloBateria", NVarChar, ModeloBateria.trim())
          .input("cantBaterias", Int, parseInt(CantBaterias))
          .input("añoFabricacionBaterias", Int, parseInt(AñoFabricacionBaterias))
          .query(queryInsertEquipo);

        //Vamos a obtener el id del equipo para validar la inserción
        const idEquipo = inserEquipoResponse.recordset[0].idEquipo;
        if (!idEquipo) {
          await transaction.rollback();
          return res.status(404).send({ type: "fatal", message: "Ocurrió un error al registrar el equipo" });
        }

        //Preparamos nuevo request para insertar las mediciones electricas
        const requestMediciones = new Request(transaction);

        const queryInsertMediciones = `
            INSERT INTO mediciones_electricas (
              idReporte,
              enFFAB, enFFBC, enFFCA,
              enFNAN, enFNBN, enFNCN,
              CorrA, CorrB, CorrC,
              SalFFAB, SalFFBC, SalFFCA,
              SalFNAN, SalFNBN, SalFNCN,
              CorrSalidaA, CorrSalidaB, CorrSalidaC
            ) VALUES (
              @idReporte,
              @enFFAB, @enFFBC, @enFFCA,
              @enFNAN, @enFNBN, @enFNCN,
              @CorrA, @CorrB, @CorrC,
              @SalFFAB, @SalFFBC, @SalFFCA,
              @SalFNAN, @SalFNBN, @SalFNCN,
              @CorrSalidaA, @CorrSalidaB, @CorrSalidaC
            )`;

        await requestMediciones
          .input('idReporte', UniqueIdentifier, idReporte)
          .input('enFFAB', Decimal, parseFloat(EnFFAB))
          .input('enFFBC', Decimal, parseFloat(EnFFBC))
          .input('enFFCA', Decimal, parseFloat(EnFFCA))
          .input('enFNAN', Decimal, parseFloat(EnFNAN))
          .input('enFNBN', Decimal, parseFloat(EnFNBN))
          .input('enFNCN', Decimal, parseFloat(ENFNCN))
          .input('CorrA', Decimal, parseFloat(CorrA))
          .input('CorrB', Decimal, parseFloat(CorrB))
          .input('CorrC', Decimal, parseFloat(CorrC))
          .input('SalFFAB', Decimal, parseFloat(SalFFAB))
          .input('SalFFBC', Decimal, parseFloat(SalFFBC))
          .input('SalFFCA', Decimal, parseFloat(SalFFCA))
          .input('SalFNAN', Decimal, parseFloat(SalFNAN))
          .input('SalFNBN', Decimal, parseFloat(SalFNBN))
          .input('SalFNCN', Decimal, parseFloat(SalFNCN))
          .input('CorrSalidaA', Decimal, parseFloat(CorrSalidaA))
          .input('CorrSalidaB', Decimal, parseFloat(CorrSalidaB))
          .input('CorrSalidaC', Decimal, parseFloat(CorrSalidaC))
          .query(queryInsertMediciones);

        // Insertar datos adicionales
        const requestDatos = new Request(transaction);

        const queryInsertDatos = `
            INSERT INTO datosAdicionales (
              idReporte,
              frecuenciaEntrada, frecuenciaSalida, porcentajeCarga,
              tensionBateria, corrienteBateria, temperaturaUPS
            ) VALUES (
              @idReporte,
              @frecuenciaEntrada, @frecuenciaSalida, @porcentajeCarga,
              @tensionBateria, @corrienteBateria, @temperaturaUPS
            )`;

        await requestDatos
          .input('idReporte', UniqueIdentifier, idReporte)
          .input('frecuenciaEntrada', Decimal, parseFloat(FrecEntr))
          .input('frecuenciaSalida', Decimal, parseFloat(FrecSalid))
          .input('porcentajeCarga', Decimal, parseFloat(PorCarga))
          .input('tensionBateria', Decimal, parseFloat(TenBateria))
          .input('corrienteBateria', Decimal, parseFloat(CorrBateria))
          .input('temperaturaUPS', Decimal, parseFloat(TempUPS))
          .query(queryInsertDatos);

        // Insertar imágenes de referencia
        const files = (req as any).files;
        if (files && files.length > 0) {
          const requestImagenes = new Request(transaction);

          for (const file of files) {
            const queryInsertImagen = `
                INSERT INTO imagenesReferencia (
                  idReporte, nombreArchivo, urlArchivo, tipoMime, tamanio
                ) VALUES (
                  @idReporte, @nombreArchivo, @urlArchivo, @tipoMime, @tamanio
                )`;

            await requestImagenes
              .input('idReporte', UniqueIdentifier, idReporte)
              .input('nombreArchivo', NVarChar, file.originalname)
              .input('urlArchivo', NVarChar, `/uploads/${file.filename}`)
              .input('tipoMime', NVarChar, file.mimetype)
              .input('tamanio', Int, file.size)
              .query(queryInsertImagen);
          }
        }

        // Confirmar la transacción si todo salió bien
        await transaction.commit();
        return res.status(201).send("Correcto");
      } catch (error) {
        //Si hay error, hacemos rollback para deshacer los cambios
        await transaction.rollback();
        console.error("Error al crear el reporte: ", error);
        return res.status(500).send({ type: "fatal", message: "Error al crear el reporte" });
      }
    } catch (error) {
      console.error("Error al crear el reporte: ", error);
      return res.status(500).send({ type: "fatal", message: "Error al crear el reporte" });
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