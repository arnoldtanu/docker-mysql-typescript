import mysql from "mysql";
import { dbConfig } from "../config/db";

export const db = mysql.createConnection(dbConfig);

db.connect(function(err) {
  if (err) {
    return console.error('error: ' + err.message);
  }
  console.log('Connected to the MySQL server.');
});