import { createRefreshToken, createAuthToken } from "../functions/createToken";
import controllerProps from "./interfaces";
import { Client } from "ldapts";
import jwt from "jsonwebtoken";
import { it } from "node:test";

const authController: controllerProps = {
  login: async (req, res) => {
    const { username, password } = req.body;

    //Validamos los datos obligatorios
    if (!username || !password)
      return res.status(400).json({ message: "Faltan datos por completar" });

    //Validamos que cumplan los tipos de datos
    if (typeof username !== "string" || typeof password !== "string")
      return res.status(400).json({ message: "Datos ingresados no son válidos" });

    //Configuramos el cliente LDAP
    try {
      const AD_HOST = process.env.AD_HOST || "localhost";
      const AD_DOMAIN = process.env.AD_DOMAIN;
      const userWithDomain = username + "@" + AD_DOMAIN;

      //Conectamos con el servidor AD
      const client = new Client({
        url: `ldap://${AD_HOST}`,
        connectTimeout: 3000,
        timeout: 10000,
        strictDN: true,
      });

      //Mandamos credenciales del cliente
      await client.bind(userWithDomain, password);

      //Si la autenticación es exitosa, creamos los tokens
      const authToken = createAuthToken(username);
      const refreshToken = createRefreshToken(username);

      //Devolvemos en la respuesta el nombre de usuario y los tokens
      return res.send({
        username,
        RCURT: refreshToken,
        RCUAT: authToken,
      });
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      return res.status(500).send({ type: "fatal", message: "Error al iniciar sesión" });
    }
  },

  refresh: async (req, res) => {
    const { RCURT: refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).send({ type: "fatal", message: "Recurso no autorizado" });

    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "JWT-Temporal-Secret-1";

    //Verificamos si el token es válido
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (error: any, decoded: any) => {
      //Si el token esta vigente, creamos un nuevo token de autenticación
      if (!error) {
        const { user } = decoded;
        const authToken = createAuthToken(user);

        //Devolvemos el nuevo token de autenticación y el usuario
        return res.send({ user, RCUAT: authToken });
      }

      //Validamos si el token tiene un error de expiración
      if (error.name === "TokenExpiredError")
        return res.status(401).send({ type: "fatal", message: "La sesión expiró" });

      //Si es otro error indicamos que el token es inválido
      return res.status(401).send({ type: "fatal", message: "Token inválido" });
    });
  },
};

export default authController;