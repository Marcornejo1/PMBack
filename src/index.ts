import express from "express";
import cors from "cors";

//Configuraciones generales para la aplicación express
const app= express();
app.use(express.json());