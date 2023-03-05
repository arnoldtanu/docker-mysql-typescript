export interface IdbConfig {
  host: string;
  database: string;
  user: string;
  password: string;
}

export const dbConfig: IdbConfig = {
  host: "db", //process.env.DB_HOST || "localhost",
  database: "atm", //process.env.DB_DATABASE || "atm",
  user: "root", //process.env.DB_USERNAME || "root",
  password: "password", //process.env.DB_PASSWORD || "password",
};
