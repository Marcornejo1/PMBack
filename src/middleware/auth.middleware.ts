//Backend: authMiddleware.ts
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

//Extender la interfaz Request para incluir el usuario y roles
declare global {
  namespace Express {
    interface Request {
      usuario?: string;
      esAdmin?: boolean;  // Para uso futuro: administrador accede a todos
      rol?: string;       // Para uso futuro: 'admin', 'editor', 'viewer', etc
    }
  }
}

//Middleware para validar si hay un refresh token válido
const validateSession = (req: Request, res: Response, next: NextFunction) => {
  //Obtenemos los headers y hacemos una comprobación
  const authHeaders = req.headers.authorization;

  if (!authHeaders)
    return res.status(401).send({ type: "fatal", message: "Recurso no autorizado" });

  //Retiramos la palabra Bearer en los headers y hacemos parse para convertirlo en objeto
  const parseAuthHeaders = JSON.parse(authHeaders.split(' ')[1]);

  if (!parseAuthHeaders.RCUAT)
    return res.status(401).send({ type: "fatal", message: "Recurso no autorizado" });

  //Obtenemos y renombramos las variables
  const { RCUAT: authToken } = parseAuthHeaders;

  const JWT_AUTH_SECRET = process.env.JWT_AUTH_SECRET || "JWT-Temporal-Secret-2";

  //Revisamos si el authToken es válido
  jwt.verify(authToken, JWT_AUTH_SECRET, (error: any, decoded: any) => {
    //Si no hay error continuamos la sesión
    if (!error) {
      //Extraemos el usuario del token decodificado
      if (decoded && decoded.user) {
        req.usuario = decoded.user;
        
        // PREPARADO PARA FUTURO: Extraer roles del token
        // if (decoded.rol) {
        //   req.rol = decoded.rol;
        //   req.esAdmin = decoded.rol === 'admin';
        // }
      }
      return next();
    }

    //Validamos si el token tiene un error de sesión expirada
    if (error.name === "TokenExpiredError")
      return res.status(401).send({ type: "fatal", message: "La sesión expiró" });

    //Si es otro error indicamos que el token es inválido
    return res.status(401).send({ type: "fatal", message: "Token inválido" });
  });
};

export default validateSession;