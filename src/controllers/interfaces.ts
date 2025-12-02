//Este archivo nos permite tener las interfaces con los tipos de datos que usaremos en los controladores
import { Request, Response } from 'express';

interface controllerProps {
  [key: string]: (req: Request, res: Response) => void;
}
export default controllerProps;