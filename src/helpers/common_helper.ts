import { v1 as uuid } from "uuid";

export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const uuidStringToBinQuery = (uuid: string, withQuotes = true) => {
  const variable = withQuotes ? `'${uuid}'` : uuid;
  return `UNHEX(REPLACE(${variable},'-',''))`; //mariadb
  return `UUID_TO_BIN(${variable})`; //mysql
};

export const binToUUIDStringQuery = (fieldName: string) => {
  return `HEX(${fieldName})`; //mariadb
  return `BIN_TO_UUID(${fieldName})`; //mysql
};

export const createUUID = () => uuid().replace(/-/g, "").toUpperCase();