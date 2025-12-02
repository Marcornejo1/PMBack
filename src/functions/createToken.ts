import jwt from "jsonwebtoken";

export const createRefreshToken = (user: string): string => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "JWT-Temporal-Secret-1";
  const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || "30d";

  const token = jwt.sign({ user }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
  });

  return token;
};

export const createAuthToken = (user: string): string => {
  const JWT_AUTH_SECRET = process.env.JWT_AUTH_SECRET || "JWT-Temporal-Secret-2";
  const JWT_AUTH_EXPIRATION = process.env.JWT_AUTH_EXPIRATION || "15m";

  const token = jwt.sign({ user }, JWT_AUTH_SECRET, {
    expiresIn: JWT_AUTH_EXPIRATION,
  });

  return token;
};