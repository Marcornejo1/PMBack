import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import validateSession from "./middleware/auth.middleware";

//Configuraciones generales para la aplicación express
const app= express();
app.use(express.json());

//Configuramos cors para el envío y uso de cookies al frontend
const FRONTEND_HOST = process.env.FRONTEND_HOST || "http://localhost";
const FRONTEND_PORT = process.env.FRONTEND_PORT || "5151";

app.use(cors({
  origin: [`${FRONTEND_HOST}:${FRONTEND_PORT}`],
  credentials: true
}));

app.get('/api', (_, res) => {
  res.send("Bienvenido a la API del sistema de generacion de reportes");
});

//Rutas de la api
app.use("/api/auth", authRouter);


const host = process.env.BACKEND_HOST || "http://localhost";
const port = process.env.BACKEND_PORT || "3015";

app.listen(port, () => console.log(`Escuchando en ${host}:${port}/`));