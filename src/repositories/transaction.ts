import { v1 as uuid } from "uuid";
import { binToUUIDStringQuery, uuidStringToBinQuery } from "../helpers/common_helper";
import { db } from "./mysql";
import { MysqlError } from "mysql";
import { IBalanceDebt, IDebt, ITransactionQueue, IUserFinancial } from "../helpers/interfaces";

export const getUserBalanceDebt = (uuid: string) => { //OKE
  return new Promise<IBalanceDebt>((resolve, reject) => {
    const stmt = `SELECT balance, outstanding_debt FROM user WHERE uuid = ${uuidStringToBinQuery(uuid)}`;
    const param : string[] = [];
    db.query(stmt, param, (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      if (typeof results[0] === "undefined") {
        resolve({
          balance: 0,
          debt: 0,
        });
      } else {
        resolve({
          balance: results[0].balance,
          debt: results[0].outstanding_debt,
        });
      }
    });
  });
};

export const doWithdraw = (userID: string, balanceDebt: IBalanceDebt, amount: number) => {
  return new Promise<IBalanceDebt>((resolve) => {
    db.beginTransaction((err) => {
      if (err) { throw err; }
      const currDate = new Date();
      let stmt = `INSERT INTO transaction (uuid, sender, receiver, amount, trans_type, created_at) VALUES 
        (${uuidStringToBinQuery(uuid())},${uuidStringToBinQuery(userID)},${uuidStringToBinQuery(userID)},?,?,?)`;
      let param = [amount, 'WITHDRAW', currDate];
      db.query(stmt, param, (error:MysqlError | null) => {
        if (error) {
          return db.rollback(() => {
            throw error;
          });
        }
        const newBalance = balanceDebt.balance - amount;
        stmt = `UPDATE user SET balance = ?, updated_at = ? WHERE uuid = ${uuidStringToBinQuery(userID)}`;
        param = [newBalance, currDate];
        db.query(stmt, param, (error:MysqlError | null) => {
          if (error) {
            return db.rollback(() => {
              throw error;
            });
          }
          db.commit((error:MysqlError | null) => {
            if (error) {
              return db.rollback(() => {
                throw error;
              });
            }
            resolve({
              balance: newBalance,
              debt: balanceDebt.debt,
            });
          });
        });
      });
    });
  });
};

export const getUserDebt = async (userID:string, page:number, oneDataAtTime = true, lenderID = "") => {
  return new Promise<IDebt[]>((resolve, reject) => {
    let stmt = `SELECT ${binToUUIDStringQuery('uuid')} as uuid,
                      ${binToUUIDStringQuery('debtor')} as debtor,
                      ${binToUUIDStringQuery('lender')} as lender, 
                      amount 
                FROM debt WHERE is_paid = false AND debtor = ${uuidStringToBinQuery(userID)}`;
    if (lenderID !== "") stmt += ` AND lender = ${uuidStringToBinQuery(lenderID)}`;
    if (oneDataAtTime) stmt += ` ORDER BY created_at LIMIT ${page},1`;
    const param : string[] = [];
    db.query(stmt, param, (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      if (typeof results[0] != "undefined") {
        resolve(results);
      } else {
        resolve([]);
      }
    });
  });
};

export const getUserFinancialList = async (userID:string) => {
  return new Promise<IUserFinancial[]>((resolve, reject) => {
    const stmt = `SELECT SUM(D.amount) as amount, B.name as debtor, 
      ${binToUUIDStringQuery('D.debtor')} as debtorID, L.name as lender, 
      ${binToUUIDStringQuery('D.lender')} as lenderID FROM Debt D
      LEFT JOIN user B ON D.debtor = B.uuid 
      LEFT JOIN user L ON D.lender = L.uuid
      WHERE D.is_paid = false AND D.lender = ${uuidStringToBinQuery(userID)} OR D.debtor = ${uuidStringToBinQuery(userID)} GROUP BY D.lender, D.debtor;`;
    db.query(stmt, [], (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      if (typeof results[0] != "undefined") {
        resolve(results);
      } else {
        resolve([]);
      }
    });
  });
};

interface IUpdateUserBalance {
  uuid: string;
  balance: number;
  outstanding_debt: number;
  updated_at: Date;
}

const updateUserBalance = async (params:IUpdateUserBalance) => {
  return new Promise<boolean>((resolve, reject) => {
    let stmt = `UPDATE user SET balance = ?, outstanding_debt = ?, updated_at = ? WHERE uuid = ${uuidStringToBinQuery(params.uuid)}`;
    const param = [params.balance, params.outstanding_debt, params.updated_at];
    db.query(stmt, param, (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

interface IUpdateDebt {
  uuid: string,
  amount: number,
  is_paid: boolean,
  updated_at: Date
}

const updateDebt = async (params:IUpdateDebt) => {
  return new Promise<boolean>((resolve, reject) => {
    let stmt = `UPDATE debt SET amount = ?, is_paid = ?, updated_at = ? WHERE uuid = ${uuidStringToBinQuery(params.uuid)}`;
    const param = [params.amount, params.is_paid, params.updated_at];
    db.query(stmt, param, (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

const insertDebt = async (params:IDebt, currDate:Date) => {
  return new Promise<boolean>((resolve, reject) => {
    let stmt = `INSERT INTO debt (uuid, debtor, lender, amount, created_at, is_paid, updated_at)
      VALUES (${uuidStringToBinQuery("?", false)},${uuidStringToBinQuery("?", false)},${uuidStringToBinQuery("?", false)},?,?,?,?)`;
    let param : any[] = [
      params.uuid,
      params.debtor,
      params.lender,
      params.amount,
      currDate,
      false,
      currDate,
    ];
    db.query(stmt, param, (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

const insertTransaction = async (params:ITransactionQueue, currDate:Date) => {
  return new Promise<boolean>((resolve, reject) => {
    let stmt = `INSERT INTO transaction (uuid, sender, receiver, amount, trans_type, created_at)
      VALUES (${uuidStringToBinQuery("?", false)},${uuidStringToBinQuery("?", false)},${uuidStringToBinQuery("?", false)},?,?,?)`;
    let param : any[] = [
      params.uuid,
      params.fromID,
      params.toID,
      params.originalAmount,
      params.transType,
      currDate,
    ];
    db.query(stmt, param, (err:MysqlError | null, results: any) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

export const doDepositAndTransfer = async (transactionQueue:ITransactionQueue[], userBalanceCache:Map<string, IBalanceDebt>, debtHistoryCache: Map<string, IDebt>,
  newDebtRecord:IDebt[]) => {
  return new Promise<boolean>((resolve) => {

    db.beginTransaction(async (err) => {
      if (err) { throw err; }
      const currDate = new Date();

      transactionQueue.map(async (data:ITransactionQueue) => await insertTransaction(data, currDate));
      newDebtRecord.map(async (data:IDebt) => await insertDebt(data, currDate));

      for (let [key, value] of userBalanceCache) {
        let params : IUpdateUserBalance = {
          uuid: key,
          balance: value.balance,
          outstanding_debt: value.debt,
          updated_at: currDate,
        };
        await updateUserBalance(params);
      }

      for (let [key, value] of debtHistoryCache) {
        let paid = value.amount === 0;
        let params : IUpdateDebt = {
          uuid: key,
          amount: value.amount,
          is_paid: paid,
          updated_at: currDate,
        };
        await updateDebt(params);
      }

      db.commit((error:MysqlError | null) => {
        if (error) {
          return db.rollback(() => {
            throw error;
          });
        }
        resolve(true);
      });
    });
  });
};