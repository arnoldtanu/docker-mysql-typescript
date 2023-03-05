import { uuidStringToBinQuery, binToUUIDStringQuery, createUUID } from "../helpers/common_helper";
import { db } from "./mysql";
import { MysqlError } from "mysql";

export interface IUserIDAndBalance {
  uuid : string;
  balance: number;
  debt: number;
}

export const register = async (username: string) => {
  return new Promise<IUserIDAndBalance>((resolve, reject) => {
    const currDate = new Date();
    const generatedUUID : string = createUUID();
    const stmt = `INSERT INTO user (uuid, name, created_at, updated_at,balance,outstanding_debt) VALUES (${uuidStringToBinQuery(generatedUUID)},?,?,?,0,0)`;
    const param = [username, currDate, currDate];
    db.query(stmt, param, (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      resolve({
        uuid: generatedUUID,
        balance: 0,
        debt: 0,
      });
    });
  });
};

export const getUserIDAndBalance = async (username:string) => {
  return new Promise<IUserIDAndBalance>((resolve, reject) => {
    const stmt = `SELECT ${binToUUIDStringQuery('uuid')} as uuid, balance, outstanding_debt as debt FROM user WHERE name = ?`;
    const param = [username];
    db.query(stmt, param, (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      if (typeof results.length != "undefined" && results.length > 0) {
        resolve({
          uuid: results[0].uuid,
          balance: results[0].balance,
          debt: results[0].debt,
        });
      } else {
        resolve({
          uuid: "",
          balance: 0,
          debt: 0,
        });
      }
    });
  });
};

export const getUserName = async (userID:string) => {
  return new Promise<string>((resolve, reject) => {
    const stmt = `SELECT name FROM user WHERE uuid = ${uuidStringToBinQuery(userID)}`;
    db.query(stmt, [], (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      if (typeof results.length != "undefined" && results.length > 0) {
        resolve(results[0].name);
      } else {
        resolve("");
      }
    });
  });
};