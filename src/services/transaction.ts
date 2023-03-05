import { createUUID } from "../helpers/common_helper";
import { IBalanceDebt, IDebt, ITransactionQueue, IUserFinancial } from "../helpers/interfaces";
import { getUserBalanceDebt, doWithdraw, getUserDebt, getUserFinancialList, doDepositAndTransfer } from "../repositories/transaction";
import { defaultDebt, defaultUserBalance, TRANSTYPE } from "../assets/constant";
import { getUserIDAndBalance, IUserIDAndBalance } from "../repositories/user";

export const deposit = async (uuid : string, amount : number) => {
  try {
    let balanceAndDebt : IBalanceDebt = await getUserBalanceDebt(uuid);
    return depositAndTransfer(uuid, balanceAndDebt, uuid, balanceAndDebt, amount);
  } catch (e) {
    console.log("error:", e);
  }
};

export const transfer = async (senderID : string, receiverName:string, amount: number) => {
  try {
    const senderBalance : IBalanceDebt = await getUserBalanceDebt(senderID);
    const receiverData : IUserIDAndBalance = await getUserIDAndBalance(receiverName);
    if (receiverData.uuid === "") console.log("sorry receiver not found");
    else if (senderID === receiverData.uuid) console.log("sorry cannot transfer to yourself");
    else {
      const receiverBalance : IBalanceDebt = {
        balance: receiverData.balance,
        debt: receiverData.debt,
      };
      return depositAndTransfer(senderID, senderBalance, receiverData.uuid, receiverBalance, amount);
    }
  } catch (e) {
    console.log("error:", e);
  }
};

export const depositAndTransfer = async (senderID : string, senderBalance : IBalanceDebt, receiverID:string, receiverBalance : IBalanceDebt, amount : number) => {
  try {
    let queueNumber = 0;
    const userBalanceCache = new Map<string, IBalanceDebt>([[senderID, senderBalance]]);
    const debtHistoryCache = new Map<string, IDebt>();
    const newDebtRecord : IDebt[] = [];
    const mode = (senderID === receiverID) ? TRANSTYPE.DEPOSIT : TRANSTYPE.TRANSFER;
    const transactionQueue : ITransactionQueue[] = [{
      uuid: createUUID(),
      fromID: senderID,
      toID: receiverID,
      amount: amount,
      originalAmount: amount,
      transType: mode,
      debtID: null, //reference to debt table, to be updated on takeMoneyFromSender
    }];
    if (senderID !== receiverID) userBalanceCache.set(receiverID, receiverBalance);

    while (queueNumber < transactionQueue.length) {
      if (transactionQueue[queueNumber].transType === TRANSTYPE.TRANSFER || transactionQueue[queueNumber].transType === TRANSTYPE.DEBT) {
        await takeMoneyFromSender(userBalanceCache, debtHistoryCache, newDebtRecord, transactionQueue[queueNumber]);
      }
      if (transactionQueue[queueNumber].amount > 0) await sendMoneyToReceiver(userBalanceCache, debtHistoryCache, transactionQueue, queueNumber);
      queueNumber++;
    }

    await doDepositAndTransfer(transactionQueue, userBalanceCache, debtHistoryCache, newDebtRecord);
    return userBalanceCache.get(senderID);
  } catch (e) {
    console.log("error:", e);
  }
};

export const sendMoneyToReceiver = async (userBalanceCache: Map<string, IBalanceDebt>, debtHistoryCache: Map<string, IDebt>, transactionQueue: ITransactionQueue[],
  queueNumber:number) => {
  try {
    const transaction = transactionQueue[queueNumber];

    // get receiver's balance
    const tempUserBalance = (!userBalanceCache.has(transaction.toID)) ? await getUserBalanceDebt(transaction.toID) :
      (userBalanceCache.get(transaction.toID) ?? defaultUserBalance);
    tempUserBalance.balance += transaction.amount;
    userBalanceCache.set(transaction.toID, tempUserBalance);

    //check whether receiver have debt to others, if have debt add it to transactionQueue and debtHistoryCache to be process later
    if (tempUserBalance.debt > 0) {
      await getDebtListUserShouldPay(tempUserBalance, transaction, debtHistoryCache, transactionQueue);
    }
  } catch (e) {
    console.log("error:", e);
  }
};

export const getDebtListUserShouldPay = async (tempUserBalance:IBalanceDebt, transaction:ITransactionQueue, debtHistoryCache:Map<string, IDebt>, transactionQueue:ITransactionQueue[]) => {
  if (tempUserBalance.debt <= tempUserBalance.balance) {
    //if user can pay all his/her's debt
    let allData : IDebt[] = await getUserDebt(transaction.toID, 0, false); //TODO: pas getuserdebt, sekalian return in data id pengutang
    allData.map((eachData:IDebt) => {
      //check if debt hasn't been processed in this batch (prevent recursive process, because 3 or more people have debt to each other)
      if (!debtHistoryCache.has(eachData.uuid)) {
        transactionQueue.push({
          uuid: createUUID(),
          fromID: eachData.debtor,
          toID: eachData.lender,
          amount: eachData.amount,
          originalAmount: eachData.amount,
          transType: TRANSTYPE.DEBT,
          debtID: eachData.uuid,
        });
        debtHistoryCache.set(eachData.uuid, eachData);
      }
    });
  } else {
    //if receiver can't pay all his/her's debt
    let page = 0;
    let keepIterate = true;
    let tempBalance = tempUserBalance.balance;
    while (keepIterate) {
      let data : IDebt[] = await getUserDebt(transaction.toID, page, true);
      if (data.length === 0 || tempBalance <= 0) keepIterate = false;
      else if (!debtHistoryCache.has(data[0].uuid)) {
        //if debt hasn't been processed in this batch (prevent recursive process, because 3 or more people have debt to each other)
        tempBalance -= data[0].amount;
        transactionQueue.push({
          uuid: createUUID(),
          fromID: data[0].debtor,
          toID: data[0].lender,
          amount: data[0].amount,
          originalAmount: data[0].amount,
          transType: TRANSTYPE.DEBT,
          debtID: data[0].uuid,
        });
        debtHistoryCache.set(data[0].uuid, data[0]);
      }
      page++;
    }
  }
};

export const takeMoneyFromSender = async (userBalanceCache: Map<string, IBalanceDebt>, debtHistoryCache: Map<string, IDebt>, newDebtRecord:IDebt[], transaction: ITransactionQueue) => {
  try {
    // get sender's balance
    const tempUserBalance = (!userBalanceCache.has(transaction.fromID)) ? await getUserBalanceDebt(transaction.fromID) :
      (userBalanceCache.get(transaction.fromID) ?? defaultUserBalance);

    //check if sender can send money by using receiver's debt to him/her
    await payDebtWithDebt(userBalanceCache, transaction, debtHistoryCache);

    if (transaction.amount > 0) {
      tempUserBalance.balance -= transaction.amount; //reduce sender's balance

      let underpayment = 0;

      //if sender's balance is not enough, reset balance to 0, adjust transaction's amount to what sender can pay
      if (tempUserBalance.balance < 0) {
        transaction.amount = tempUserBalance.balance + transaction.amount; //tempUserBalance.balance still negative
        underpayment = 0 - tempUserBalance.balance;
        tempUserBalance.balance = 0;
      }

      // if debtID have value, this transaction related to debt, update debtHistoryCache & sender's debt
      if (transaction.debtID) {
        const tempDebt = debtHistoryCache.get(transaction.debtID) ?? defaultDebt;
        if (underpayment === 0) tempDebt.amount = 0;
        else tempDebt.amount -= transaction.amount;
        tempUserBalance.debt -= transaction.amount;
        debtHistoryCache.set(transaction.debtID, tempDebt);
      } else if (underpayment > 0) {
        tempUserBalance.debt += underpayment;
        newDebtRecord.push({
          uuid: createUUID(),
          debtor: transaction.fromID,
          lender: transaction.toID,
          amount: underpayment,
          transaction_ref: transaction.uuid,
        });
      }

      userBalanceCache.set(transaction.fromID, tempUserBalance);
    }
  } catch (e) {
    console.log("error:", e);
  }
};

export const payDebtWithDebt = async (userBalanceCache:Map<string, IBalanceDebt>, transaction:ITransactionQueue, debtHistoryCache: Map<string, IDebt>) => {
  let page = 0;
  let keepIterate = true;
  const receiverBalance = (!userBalanceCache.has(transaction.toID)) ? await getUserBalanceDebt(transaction.toID) :
    (userBalanceCache.get(transaction.toID) ?? defaultUserBalance);
  while (keepIterate) {
    const data : IDebt[] = await getUserDebt(transaction.toID, page, true, transaction.fromID);
    if (data.length <= 0 || transaction.amount <= 0) keepIterate = false;
    else {
      transaction.amount -= data[0].amount;
      if (transaction.amount > 0) {
        receiverBalance.debt -= data[0].amount;
        data[0].amount = 0;
      } else {
        const temp = data[0].amount;
        data[0].amount = 0 - transaction.amount;
        receiverBalance.debt -= (temp - data[0].amount);
        transaction.amount = 0;
        keepIterate = false;
      }
      if (receiverBalance.debt === 0) keepIterate = false;
      debtHistoryCache.set(data[0].uuid, data[0]);
    }
    page++;
  }
  userBalanceCache.set(transaction.toID, receiverBalance);
};

export const withdraw = async (uuid : string, amount : number) => {
  try {
    const balanceAndDebt = await getUserBalanceDebt(uuid);
    if (balanceAndDebt.balance < amount) {
      console.log("Sorry, you don't have enough balance");
      await printUserFinancialList(uuid, balanceAndDebt);
      return balanceAndDebt;
    } else {
      const newBalance : IBalanceDebt = await doWithdraw(uuid, balanceAndDebt, amount);
      await printUserFinancialList(uuid, newBalance);
      return newBalance;
    }
  } catch (e) {
    console.log("error:", e);
  }
};

export const printUserFinancialList = async (userID : string, balance : IBalanceDebt) => {
  console.log("Your balance is $" + balance.balance);
  const list : IUserFinancial[] = await getUserFinancialList(userID);
  const OwedTo : string[] = [];
  list.map((data) => {
    if (data.lenderID === userID) console.log("Owed $" + data.amount + " from " + data.debtor);
    else OwedTo.push("Owed $" + data.amount + " to " + data.lender);
  });
  OwedTo.map((data) => {
    console.log(data);
  });
};