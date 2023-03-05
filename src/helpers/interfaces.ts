import { TRANSTYPE } from "../assets/constant";

export type TBasicTransType = TRANSTYPE.TRANSFER | TRANSTYPE.DEPOSIT | TRANSTYPE.DEBT;
type TAdditionalTransType = TRANSTYPE.WITHDRAW;
export type TTransType = TBasicTransType | TAdditionalTransType;

export interface IUser{
  name: string;
  uuid: string;
}

export interface IBalanceDebt {
  balance: number;
  debt: number;
}

export interface IDebt {
  uuid:string;
  debtor:string;
  lender:string;
  amount:number;
  transaction_ref: string;
  created_at?:string;
  is_paid?:boolean;
  updated_at?:string;
}

export interface ITransaction {
  uuid:string;
  sender:string;
  receiver:string;
  amount:number;
  trans_type:TTransType;
  created_at?:string;
}

export interface ITransactionQueue {
  uuid:string;
  fromID:string;
  toID:string;
  amount:number;
  originalAmount:number;
  transType:TBasicTransType;
  debtID:string | null;
}

export interface IUserFinancial {
  amount:number;
  debtor:string;
  debtorID:string;
  lender:string;
  lenderID:string;
}