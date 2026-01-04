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
      const AD_DOMAIN = process.env.AD_DOMAIN ||"example.com";
      const userWithDomain = username + "@" + AD_DOMAIN;

      //Conectamos con el servidor AD
      const client = new Client({
        url: `ldap://${AD_HOST}`,
        connectTimeout: 3000,
        timeout: 10000,
        strictDN: false,
      });

      // Intentamos bind con UPN (user@domain)
      try {
        await client.bind(userWithDomain, password);

        //Si la autenticación es exitosa, creamos los tokens
        const authToken = createAuthToken(username);
        const refreshToken = createRefreshToken(username);

        await client.unbind();
        //Devolvemos en la respuesta el nombre de usuario y los tokens
        return res.send({
          username,
          RCURT: refreshToken,
          RCUAT: authToken,
        });
      } catch (bindError: any) {
        console.error("Bind con UPN falló:", bindError);
        // Si hay un error de sintaxis DN (invalid DN), intentamos buscar el DN y bindear con él
        if (bindError && bindError.code === 34) {
          try {
            const LDAP_ADMIN_PASSWORD = process.env.LDAP_ADMIN_PASSWORD || "adminpassword";
            const domainBase = AD_DOMAIN.split('.').map(p => `dc=${p}`).join(',');
            const adminDN = process.env.LDAP_ADMIN_DN || `cn=admin,${domainBase}`;

            // Bind como admin para realizar la búsqueda
            await client.bind(adminDN, LDAP_ADMIN_PASSWORD);

            // Preparar candidatos para base de búsqueda: AD_SEARCH_BASE (si está) y la base derivada de AD_DOMAIN
            const configuredBase = (process.env.AD_SEARCH_BASE || '').trim();
            const derivedBase = domainBase;
            const searchBases = [] as string[];
            if (configuredBase) searchBases.push(configuredBase);
            if (!searchBases.includes(derivedBase)) searchBases.push(derivedBase);

            // Usamos filtro OR para buscar por cn, uid o mail
            const searchFilter = `(|(cn=${username})(uid=${username})(mail=${username}))`;

            let foundEntry: any = null;
            for (const base of searchBases) {
              try {
                const { searchEntries } = await client.search(base, {
                  scope: 'sub',
                  filter: searchFilter,
                  attributes: ['dn'],
                });

                if (searchEntries && searchEntries.length > 0) {
                  foundEntry = searchEntries[0];
                  break;
                }
              } catch (err: any) {
                // Si la base no existe (NoSuchObject), probamos la siguiente. Si es otro error, lo lanzamos.
                if (err && err.code === 32) {
                  console.warn(`Base ${base} no existe, probando siguiente...`);
                  continue;
                }
                throw err;
              }
            }

            if (foundEntry) {
              const userDN = foundEntry.dn as string;
              try {
                // Intentamos bind con el DN del usuario
                await client.bind(userDN, password);

                const authToken = createAuthToken(username);
                const refreshToken = createRefreshToken(username);

                await client.unbind();
                return res.send({ username, RCURT: refreshToken, RCUAT: authToken });
              } catch (userBindError: any) {
                console.error("Error al autenticar con DN del usuario:", userBindError);
                await client.unbind();
                return res.status(401).send({ type: "fatal", message: "Credenciales inválidas" });
              }
            } else {
              await client.unbind();
              return res.status(400).send({ type: "fatal", message: "Usuario no encontrado" });
            }
          } catch (searchError: any) {
            console.error("Error buscando DN o bind como admin:", searchError);
            try { await client.unbind(); } catch (e) {}
            return res.status(500).send({ type: "fatal", message: "Error al iniciar sesión" });
          }
        }

        // Otros errores de bind
        try { await client.unbind(); } catch (e) {}
        if (bindError && bindError.code === 49)
          return res.status(401).send({ type: "fatal", message: "Credenciales inválidas" });

        return res.status(500).send({ type: "fatal", message: "Error al iniciar sesión" });
      }
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