
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FUNCIONES HELPER PARA LDAP - PREPARADAS PARA FUTURO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Descomentar y ajustar cuando se implemente lectura de roles/grupos desde LDAP
 * Ver: LEER_ROLES_LDAP_FUTURO.md para instrucciones completas
 *

import { Client as LdapClient, SearchOptions } from 'ldapts';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * FUNCIÓN 1: Obtener información extendida del usuario desde LDAP
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Lee del Active Directory:
 *   • Email / Correo electrónico
 *   • Nombre completo
 *   • Departamento
 *   • Grupos a los que pertenece
 *   • Cargo/Title
 *   • Y otros atributos
 *
 * CÓMO USAR (cuando implementes):
 *   const infoUsuario = await obtenerInfoUsuarioLDAP(
 *     client,
 *     'usuarioA',
 *     'DC=empresa,DC=com'
 *   );
 *   console.log(infoUsuario.groups); // Array de grupos DN
 *
export const obtenerInfoUsuarioLDAP = async (
  client: LdapClient,
  username: string,
  baseDN: string
): Promise<any> => {
  try {
    const options: SearchOptions = {
      scope: 'sub',
      // Atributos a traer del LDAP
      attributes: [
        'mail',              // Correo electrónico
        'displayName',       // Nombre completo
        'department',        // Departamento
        'memberOf',          // Grupos a los que pertenece
        'title',             // Cargo/Puesto
        'description',       // Descripción
        'sn',                // Apellido
        'givenName',         // Nombre de pila
        'telephoneNumber',   // Teléfono
        'mobile',            // Celular
        'userAccountControl',// Estado de cuenta
        'lastLogon',         // Último login
      ]
    };

    const searchResult = await client.search(
      baseDN,
      {
        filter: `(sAMAccountName=${username})`,
        ...options
      }
    );

    if (searchResult.entries && searchResult.entries.length > 0) {
      const userEntry = searchResult.entries[0];

      return {
        sAMAccountName: userEntry.sAMAccountName,
        mail: userEntry.mail || null,
        displayName: userEntry.displayName || null,
        department: userEntry.department || null,
        groups: userEntry.memberOf || [],  // Array de grupos DN
        title: userEntry.title || null,
        givenName: userEntry.givenName || null,
        sn: userEntry.sn || null,
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener información de LDAP:', error);
    throw error;
  }
};

/**
 * ───────────────────────────────────────────────────────────────────────────
 * FUNCIÓN 2: Determinar rol basado en grupos LDAP
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Mapea grupos de Active Directory a roles de la aplicación:
 *
 *   Grupo LDAP: CN=Admins,OU=Grupos,DC=company,DC=com      →  Rol: 'admin'
 *   Grupo LDAP: CN=Supervisors,OU=Grupos,DC=company,DC=com →  Rol: 'supervisor'
 *   Grupo LDAP: CN=Editors,OU=Grupos,DC=company,DC=com     →  Rol: 'editor'
 *   Otros grupos                                              →  Rol: 'viewer'
 *
 * VARIABLES DE ENTORNO NECESARIAS (en .env):
 *   LDAP_GRUPO_ADMIN=CN=Admins,OU=Grupos,DC=company,DC=com
 *   LDAP_GRUPO_SUPERVISOR=CN=Supervisors,OU=Grupos,DC=company,DC=com
 *   LDAP_GRUPO_EDITOR=CN=Editors,OU=Grupos,DC=company,DC=com
 *
 * CÓMO USAR:
 *   const rol = determinarRolDesdeGruposLDAP(gruposArray);
 *   console.log(rol); // 'admin' o 'supervisor' o 'editor' o 'viewer'
 *
export const determinarRolDesdeGruposLDAP = (groups: string[]): string => {
  if (!groups || groups.length === 0) {
    return 'viewer'; // Rol por defecto si no tiene grupos
  }

  // Obtener mapeo de grupos desde variables de entorno
  // Estos son los valores por defecto, reemplazar con tus grupos reales
  const grupoAdminLDAP = process.env.LDAP_GRUPO_ADMIN ||
    'CN=Admins,OU=Grupos,DC=company,DC=com';
  const grupoSupervisorLDAP = process.env.LDAP_GRUPO_SUPERVISOR ||
    'CN=Supervisors,OU=Grupos,DC=company,DC=com';
  const grupoEditorLDAP = process.env.LDAP_GRUPO_EDITOR ||
    'CN=Editors,OU=Grupos,DC=company,DC=com';

  // Verificar si usuario pertenece a grupo ADMIN
  if (groups.some(group => group.includes('Admins') || group === grupoAdminLDAP)) {
    return 'admin';
  }

  // Verificar si pertenece a grupo SUPERVISOR
  if (groups.some(group => group.includes('Supervisors') || group === grupoSupervisorLDAP)) {
    return 'supervisor';
  }

  // Verificar si pertenece a grupo EDITOR
  if (groups.some(group => group.includes('Editors') || group === grupoEditorLDAP)) {
    return 'editor';
  }

  // Rol por defecto para otros usuarios
  return 'viewer';
};

/**
 * ───────────────────────────────────────────────────────────────────────────
 * FUNCIÓN 3: Obtener nombres limpios de grupos
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Convierte DN completo de grupo a solo el nombre:
 *
 *   Entrada:  "CN=Admins,OU=Grupos,DC=company,DC=com"
 *   Salida:   "Admins"
 *
 *   Entrada:  [
 *     "CN=Admins,OU=Grupos,DC=company,DC=com",
 *     "CN=IT-Staff,OU=Grupos,DC=company,DC=com"
 *   ]
 *   Salida:   ["Admins", "IT-Staff"]
 *
 * CÓMO USAR:
 *   const nombres = extraerNombresGrupos(gruposLDAP);
 *   console.log(nombres); // ["Admins", "IT-Staff"]
 *
export const extraerNombresGrupos = (gruposLDAP: string[]): string[] => {
  if (!gruposLDAP) return [];

  return gruposLDAP.map(group => {
    // Extrae el CN (Common Name) del grupo DN completo
    // Regex: busca "CN=" seguido del nombre hasta la primera coma
    const match = group.match(/CN=([^,]+)/);
    return match ? match[1] : group;
  }).filter(Boolean); // Elimina valores null/undefined
};

/**
 * ───────────────────────────────────────────────────────────────────────────
 * FUNCIÓN 4: Verificar si usuario pertenece a un grupo específico
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Comprueba si el usuario es miembro de un grupo específico
 *
 * CÓMO USAR:
 *   const esAdmin = usuarioPerteneceAlGrupo(gruposArray, "Admins");
 *   if (esAdmin) { ... }
 *
export const usuarioPerteneceAlGrupo = (groups: string[], nombreGrupo: string): boolean => {
  if (!groups) return false;
  return groups.some(group =>
    group.includes(`CN=${nombreGrupo}`) || group.includes(nombreGrupo)
  );
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FUNCIÓN 5: Obtener perfil COMPLETO del usuario (RECOMENDADA)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Combina todas las funciones anteriores en una sola llamada
 * Retorna información completa del usuario listo para usar
 *
 * RETORNA:
 *   {
 *     usuario: "usuarioA",
 *     nombre: "Juan Pérez García",
 *     email: "juan.perez@empresa.com",
 *     departamento: "Sistemas",
 *     rol: "admin",
 *     grupos: ["Admins", "IT-Staff", "Company-Users"],
 *     cargo: "Administrador"
 *   }
 *
 * CÓMO USAR (ES LA FORMA RECOMENDADA):
 *   const perfil = await obtenerPerfilCompletoUsuario(
 *     client,
 *     'usuarioA',
 *     'DC=empresa,DC=com'
 *   );
 *
 *   console.log(perfil.rol);      // "admin"
 *   console.log(perfil.email);    // "juan.perez@empresa.com"
 *   console.log(perfil.grupos);   // ["Admins", "IT-Staff"]
 *
export const obtenerPerfilCompletoUsuario = async (
  client: LdapClient,
  username: string,
  baseDN: string
): Promise<{
  usuario: string;
  nombre: string;
  email: string;
  departamento: string;
  rol: string;
  grupos: string[];
  cargo: string;
} | null> => {
  try {
    // Obtener información del LDAP
    const infoLDAP = await obtenerInfoUsuarioLDAP(client, username, baseDN);

    if (!infoLDAP) return null;

    // Procesar información
    const gruposLimpios = extraerNombresGrupos(infoLDAP.groups);
    const rolDeterminado = determinarRolDesdeGruposLDAP(infoLDAP.groups);

    // Retornar perfil completo
    return {
      usuario: infoLDAP.sAMAccountName,
      nombre: infoLDAP.displayName || `${infoLDAP.givenName} ${infoLDAP.sn}`.trim(),
      email: infoLDAP.mail,
      departamento: infoLDAP.department,
      rol: rolDeterminado,
      grupos: gruposLimpios,
      cargo: infoLDAP.title,
    };
  } catch (error) {
    console.error('Error al obtener perfil completo del usuario:', error);
    return null;
  }
};
*/