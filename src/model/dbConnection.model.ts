import sql, { ConnectionPool } from 'mssql';

const DB_HOST = process.env.DB_HOST || 'localhost';
const { DB_USER, DB_PASS, DB_NAME } = process.env;

//Creamos configuraciones de sql
const config: sql.config = {
  server: DB_HOST,
  port: parseInt(process.env.DB_PORT || '1466'),
//Analizar donde colocar las credenciales
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  options: {
    encrypt: false,
    trustedConnection: true,
  }
};

let connectionPool: ConnectionPool | null = null;

//Creamos la función de conexión a la base de datos
const connectDB = async (): Promise<sql.ConnectionPool> => {
  if (connectionPool)
    return connectionPool;
  try {
    connectionPool = await sql.connect(config);
    console.log("Conexión exitosa");
    return connectionPool;
  } catch (err) {
    console.error("Error de conexión");
    throw err;
  }
};

export default connectDB;