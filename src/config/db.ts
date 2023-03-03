export interface IdbConfig {
  host: string;
  database: string;
  user: string;
  password: string;
}

export const dbConfig: IdbConfig = {
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "atm",
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
};
