import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import validateSession from "./middleware/auth.middleware";

//Configuraciones generales para la aplicación express
const app= express();
app.use(express.json());

//Configuramos cors para el envío y uso de cookies al frontend
const FRONTEND_HOST = process.env.FRONTEND_HOST || "http://localhost";