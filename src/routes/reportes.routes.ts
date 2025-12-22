import express from "express";
import reportesController from "../controllers/reportes.controller";

const reportesRouter: any = express.Router();

//Definimos Rutas de la api
reportesRouter.get("/", reportesController.read);

reportesRouter.post("/", reportesController.create);
reportesRouter.put("/", reportesController.update);
reportesRouter.delete("/", reportesController.delete);

export default reportesRouter;