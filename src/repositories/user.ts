import { v1 as uuid } from "uuid";
import { uuidStringToBinQuery, binToUUIDStringQuery } from "../helper/common_helper";
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
    const generatedUUID : string = uuid();
    const stmt = `INSERT INTO user (uuid, name, created_at, updated_at) VALUES (${uuidStringToBinQuery(generatedUUID)},?,?,?)`;
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
      if (typeof results[0] != "undefined") {
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