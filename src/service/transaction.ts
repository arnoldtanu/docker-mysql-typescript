import { createUUID } from "../helper/common_helper";
import { IBalanceDebt, IDebt, ITransactionQueue, IUserFinancial } from "../helper/interfaces";
import { getUserBalanceDebt, doWithdraw, getUserDebt, getUserFinancialList } from "../repositories/transaction";
import { defaultDebt, defaultUserBalance, TRANSTYPE } from "../assets/constant";
import { getUserIDAndBalance, IUserIDAndBalance } from "../repositories/user";

const doConsoleLog = true;

export const deposit = async (uuid : string, amount : number) => {
  if (doConsoleLog) console.log("_ deposit ", uuid, amount);
  try {
    let balanceAndDebt : IBalanceDebt = await getUserBalanceDebt(uuid);
    return await depositAndTransfer(uuid, balanceAndDebt, uuid, balanceAndDebt, amount);
  } catch (e) {
    console.log("error:", e);
  }
};

export const transfer = async (senderID : string, receiverName:string, amount: number) => {
  if (doConsoleLog) console.log("_ transfer ", senderID, receiverName, amount);
  try {
    //getUserIDAndBalance
    const senderBalance : IBalanceDebt = await getUserBalanceDebt(senderID);
    const receiverData : IUserIDAndBalance = await getUserIDAndBalance(receiverName);
    if (receiverData.uuid === "") console.log("sorry receiver not found");
    else if (senderID === receiverData.uuid) console.log("sorry cannot transfer to yourself");
    else {
      const receiverBalance : IBalanceDebt = {
        balance: receiverData.balance,
        debt: receiverData.debt,
      };
      return await depositAndTransfer(senderID, senderBalance, receiverData.uuid, receiverBalance, amount);
    }
  } catch (e) {
    console.log("error:", e);
  }
};

export const depositAndTransfer = async (senderID : string, senderBalance : IBalanceDebt, receiverID:string, receiverBalance : IBalanceDebt, amount : number) => {
  if (doConsoleLog) console.log("_ depositAndTransfer ", senderID, senderBalance, receiverID, receiverBalance, amount);
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
      if (doConsoleLog) console.log("-=-=-=-=- " + queueNumber + " -=-=-=-=-", transactionQueue[queueNumber]);
      if (doConsoleLog) console.log('transactionQueue[queueNumber].amount', transactionQueue[queueNumber].amount);
      if (transactionQueue[queueNumber].transType === TRANSTYPE.TRANSFER || transactionQueue[queueNumber].transType === TRANSTYPE.DEBT) {
        await takeMoneyFromSender(userBalanceCache, debtHistoryCache, newDebtRecord, transactionQueue[queueNumber]);
      }
      if (doConsoleLog) console.log('transactionQueue[queueNumber].amount', transactionQueue[queueNumber].amount);
      if (transactionQueue[queueNumber].amount > 0) await sendMoneyToReceiver(userBalanceCache, debtHistoryCache, transactionQueue, queueNumber);
      queueNumber++;
      if (doConsoleLog) console.log(userBalanceCache);
    }
    if (doConsoleLog) console.log("-=-=-=-=- FINAL -=-=-=-=-", queueNumber);
    if (doConsoleLog) console.log("userBalanceCache", userBalanceCache);
    if (doConsoleLog) console.log("debtHistoryCache", debtHistoryCache);
    if (doConsoleLog) console.log("newDebtRecord", newDebtRecord);
    if (doConsoleLog) console.log("transactionQueue", transactionQueue);

    // return await doDepositAndTransfer(transactionQueue, userBalanceCache, debtHistoryCache, newDebtRecord);
    return userBalanceCache.get(senderID);
  } catch (e) {
    console.log("error:", e);
  }
};

const sendMoneyToReceiver = async (userBalanceCache: Map<string, IBalanceDebt>, debtHistoryCache: Map<string, IDebt>, transactionQueue: ITransactionQueue[],
  queueNumber:number) => {
  if (doConsoleLog) console.log("_ sendMoneyToReceiver ", userBalanceCache, debtHistoryCache, transactionQueue, queueNumber);
  try {
    const transaction = transactionQueue[queueNumber];

    // get receiver's balance
    const tempUserBalance = (!userBalanceCache.has(transaction.toID)) ? await getUserBalanceDebt(transaction.toID) :
      (userBalanceCache.get(transaction.toID) ?? defaultUserBalance);
    tempUserBalance.balance += transaction.amount;
    userBalanceCache.set(transaction.toID, tempUserBalance);

    //if transaction have debtID = associated with the debt list,

    //check whether receiver have debt to others, if have debt add it to transactionQueue and debtHistoryCache to be process later
    if (tempUserBalance.debt > 0) {
      if (doConsoleLog) console.log("_____ punya utang", tempUserBalance.debt);
      if (tempUserBalance.debt <= tempUserBalance.balance) {
        //if receiver can pay all his/her's debt
        let allData : IDebt[] = await getUserDebt(transaction.toID, 0, false); //TODO: pas getuserdebt, sekalian return in data id pengutang
        if (doConsoleLog) console.log("_____ allData:", allData);
        allData.map((eachData:IDebt) => {
          if (doConsoleLog) console.log("_____ bisa bayar semua");
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
        if (doConsoleLog) console.log("_____ cuma bisa bayar sebagian");
        //if receiver can't pay all his/her's debt
        let page = 0;
        let keepIterate = true;
        let tempBalance = tempUserBalance.balance;
        while (keepIterate) {
          let data : IDebt[] = await getUserDebt(transaction.toID, page, true);
          if (doConsoleLog) console.log("_____ data utang", data);
          if (data.length === 0 || tempBalance <= 0) keepIterate = false;
          else if (!debtHistoryCache.has(data[0].uuid)) {
            if (doConsoleLog) console.log("_____ utang belum terdaftar di cache, ke" + page, data);
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
          } else if (doConsoleLog) console.log("_____ utang SUDAH terdaftar di cache, ke" + page, data);
          page++;
        }
      }
    }
  } catch (e) {
    console.log("error:", e);
  }
};

const takeMoneyFromSender = async (userBalanceCache: Map<string, IBalanceDebt>, debtHistoryCache: Map<string, IDebt>, newDebtRecord:IDebt[], transaction: ITransactionQueue) => {
  if (doConsoleLog) console.log("_ takeMoneyFromSender ", userBalanceCache, debtHistoryCache, newDebtRecord, transaction);
  try {
    // get sender's balance
    const tempUserBalance = (!userBalanceCache.has(transaction.fromID)) ? await getUserBalanceDebt(transaction.fromID) :
      (userBalanceCache.get(transaction.fromID) ?? defaultUserBalance);

    //check if sender can send money by using receiver's debt to him/her
    if (doConsoleLog) console.log("-+-");
    let page = 0;
    let keepIterate = true;
    const receiverBalance = (!userBalanceCache.has(transaction.toID)) ? await getUserBalanceDebt(transaction.toID) :
      (userBalanceCache.get(transaction.toID) ?? defaultUserBalance);
    if (doConsoleLog) console.log("receiver before:", receiverBalance);
    if (doConsoleLog) console.log("-");
    while (keepIterate) {
      const data : IDebt[] = await getUserDebt(transaction.toID, page, true, transaction.fromID);
      if (doConsoleLog) console.log("data ke-" + page, data);
      if (data.length <= 0 || transaction.amount <= 0) keepIterate = false;
      else {
        transaction.amount -= data[0].amount;
        if (transaction.amount >= 0) {
          receiverBalance.debt -= data[0].amount;
          data[0].amount = 0;
        } else {
          data[0].amount = 0 - transaction.amount;
          transaction.amount = 0;
          receiverBalance.debt -= transaction.originalAmount;
        }
        debtHistoryCache.set(data[0].uuid, data[0]);
      }
      page++;
    }
    userBalanceCache.set(transaction.toID, receiverBalance);
    if (doConsoleLog) console.log("receiver after:", receiverBalance);
    if (doConsoleLog) console.log("transaction.amount:", transaction.amount);
    if (doConsoleLog) console.log("-+-");

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
      } else {
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