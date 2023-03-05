import mysql from "mysql";
import { dbConfig } from "../config/db";

export const db = mysql.createConnection(dbConfig);