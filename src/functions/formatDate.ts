export const formatDate = (date: string): string => {
  if (!date)
    return "";

  //Obtenemos la fecha y creamos el nuevo objeto de tipo fecha
  const fecha = new Date(date);
  const opciones: any = { year: "2-digit", month: "2-digit", day: "2-digit", timeZone: "UTC" };

  return fecha.toLocaleDateString("es-MX", opciones);
}

export const formatDateForInputs = (date: string): string => {
  if (!date)
    return "";

  //Obtenemos la fecha y creamos el nuevo objeto de tipo fecha
  const fecha = new Date(date);
  const opciones: any = { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" };

  //Colocamos la fecha de Canadá puesto que es el formato especificado con guiones
  return fecha.toLocaleDateString("en-CA", opciones);
}