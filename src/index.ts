import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import validateSession from "./middleware/auth.middleware";
import reportesRouter from "./routes/reportes.routes";

//Configuraciones generales para la aplicación express
const app= express();
app.use(express.json());

// Headers de seguridad
app.use((req, res, next) => {
  // Prevenir XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy - Evita ejecutar scripts externos
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );
  
  // Strict Transport Security (activarse cuando tengas HTTPS)
  // res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});

//Configuramos cors para el envío y uso de cookies al frontend
const FRONTEND_HOST = process.env.FRONTEND_HOST || "http://localhost";
const FRONTEND_PORT = process.env.FRONTEND_PORT || "5151";

app.use(cors({
  origin: [`${FRONTEND_HOST}:${FRONTEND_PORT}`],
  credentials: true
}));

// Servir archivos estáticos desde la carpeta uploads con CORS habilitado
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', `${FRONTEND_HOST}:${FRONTEND_PORT}`);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads'));

app.get('/api', (_, res) => {
  res.send("Bienvenido a la API del sistema de generacion de reportes");
});

//Rutas de la api
app.use("/api/auth", authRouter);
app.use("/api/reportes", validateSession, reportesRouter);


const host = process.env.BACKEND_HOST || "http://localhost";
const port = process.env.BACKEND_PORT || "3015";

app.listen(port, () => console.log(`Escuchando en ${host}:${port}/`));