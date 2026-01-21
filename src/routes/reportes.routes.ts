import express from "express";
import reportesController from "../controllers/reportes.controller";
import multer from "multer";

const reportesRouter: any = express.Router();

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({ storage: storage });

//Definimos Rutas de la api
reportesRouter.get("/", reportesController.read);
reportesRouter.get("/readDash", reportesController.readDash);
reportesRouter.get("/findMatch", reportesController.findMatch);
reportesRouter.get("/readById/:id", reportesController.readById);
reportesRouter.get("/findMatchDiscardId", reportesController.findMatchDiscardId);
reportesRouter.post("/", upload.array('referenciaImages', 10), reportesController.create);
reportesRouter.put("/", upload.array('referenciaImages', 10), reportesController.update);
reportesRouter.delete("/:id", reportesController.delete);

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