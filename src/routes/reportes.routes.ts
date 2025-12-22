import express from "express";
import reportesController from "../controllers/reportes.controller";

const reportesRouter: any = express.Router();

//Definimos Rutas de la api
reportesRouter.get("/readDash", reportesController.readDash);

/*
// RUTAS COMENTADAS PARA REPORTES RECIENTES Y BORRADORES
// Descomentar cuando se implementen en el frontend

reportesRouter.get("/recientes", reportesController.readReportesRecientes);
reportesRouter.get("/borradores", reportesController.readBorradores);
*/

//reportesRouter.post("/", reportesController.create);
//reportesRouter.put("/", reportesController.update);
//reportesRouter.delete("/", reportesController.delete);

export default reportesRouter;