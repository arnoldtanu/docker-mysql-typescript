import { IBalanceDebt, IDebt } from "../helper/interfaces";

export enum TRANSTYPE {
  DEPOSIT = "DEPOSIT",
  TRANSFER = "TRANSFER",
  DEBT = "DEBT",
  WITHDRAW = "WITHDRAW"
}

export const defaultUserBalance : IBalanceDebt = {
  balance: 0,
  debt: 0,
};

export const defaultDebt : IDebt = {
  uuid: "",
  debtor: "",
  lender: "",
  amount: 0,
  transaction_ref: "",
};