import * as repositoriesTransaction from "../repositories/transaction";
import * as repositoriesUser from "../repositories/user";
import * as transaction from "./transaction";
import { IBalanceDebt, IDebt, ITransactionQueue, IUserFinancial } from "../helpers/interfaces";
import { defaultUserBalance, TRANSTYPE } from "../assets/constant";
import { send } from "process";
import { createUUID } from "../helpers/common_helper";

const senderID = 'personA';
const receiverID = 'personB';

const getUserBalanceDebtMock = jest.spyOn(repositoriesTransaction, "getUserBalanceDebt");
getUserBalanceDebtMock.mockImplementation(() => Promise.resolve({ balance: 0, debt: 0 }));

afterEach(() => {
  getUserDebtMock.mockClear();
});

const getUserDebtMock = jest.spyOn(repositoriesTransaction, "getUserDebt");
getUserDebtMock.mockImplementation(() => Promise.resolve([{
  uuid: createUUID(),
  debtor: receiverID,
  lender: senderID,
  amount: 50,
  transaction_ref: createUUID(),
}]));

const getDebtListUserShouldPayMock = jest.spyOn(transaction, "getDebtListUserShouldPay");
getDebtListUserShouldPayMock.mockImplementation(
  async (tempUserBalance, transaction, debtHistoryCache, transactionQueue) => {
    const nothing1 = tempUserBalance;
    const nothing2 = transaction;
    const dataIDebt = {
      uuid: "newDebt1",
      debtor: receiverID,
      lender: "personC",
      amount: 50,
      transaction_ref: "transactionOld",
    };
    debtHistoryCache.set(dataIDebt.uuid, dataIDebt);
    transactionQueue.push({
      uuid: "newTransaction",
      fromID: dataIDebt.debtor,
      toID: dataIDebt.lender,
      amount: dataIDebt.amount,
      originalAmount: dataIDebt.amount,
      transType: TRANSTYPE.DEBT,
      debtID: dataIDebt.transaction_ref,
    });
    Promise.resolve();
  });

describe('Test send money to receiver', () => {
  test('Test send money, receiver did not have debt', async () => {
    const userBalanceCache : Map<string, IBalanceDebt> = new Map([[receiverID, { balance: 0, debt: 0 }]]);
    const debtHistoryCache: Map<string, IDebt> = new Map();
    const transactionQueue: ITransactionQueue[] = [{ uuid: "transaction1",
      fromID: receiverID,
      toID: senderID,
      amount: 100,
      originalAmount: 100,
      transType: TRANSTYPE.TRANSFER,
      debtID: null }];

    const getUserBalanceDebtMock = jest.spyOn(repositoriesTransaction, "getUserBalanceDebt");
    getUserBalanceDebtMock.mockImplementation(() => Promise.resolve({ balance: 0, debt: 0 }));

    await transaction.sendMoneyToReceiver(userBalanceCache, debtHistoryCache, transactionQueue, 0);
    expect(transactionQueue.length).toBe(1);
    expect(debtHistoryCache.size).toBe(0);
  });

  test('Test send money, receiver have debt', async () => {
    const senderID = 'personA';
    const receiverID = 'personB';
    const userBalanceCache : Map<string, IBalanceDebt> = new Map([[receiverID, { balance: 0, debt: 100 }]]);
    const debtHistoryCache: Map<string, IDebt> = new Map();
    const transactionQueue: ITransactionQueue[] = [{ uuid: "transaction1",
      fromID: senderID,
      toID: receiverID,
      amount: 100,
      originalAmount: 100,
      transType: TRANSTYPE.TRANSFER,
      debtID: null }];

    await transaction.sendMoneyToReceiver(userBalanceCache, debtHistoryCache, transactionQueue, 0);
    expect(transactionQueue.length).toBe(2);
    expect(debtHistoryCache.size).toBe(1);
  });
});

describe('Test take money from sender', () => {
  test('Pay debt with debt, but debt < transaction amount', async () => {
    const userBalanceCache : Map<string, IBalanceDebt> = new Map([[senderID, { balance: 0, debt: 0 }], [receiverID, { balance: 0, debt: 100 }]]);
    const debtHistoryCache: Map<string, IDebt> = new Map();
    const transactionQueue: ITransactionQueue[] = [{ uuid: "transaction1",
      fromID: senderID,
      toID: receiverID,
      amount: 120,
      originalAmount: 120,
      transType: TRANSTYPE.TRANSFER,
      debtID: null }];

    await transaction.payDebtWithDebt(userBalanceCache, transactionQueue[0], debtHistoryCache);

    expect(getUserDebtMock).toBeCalledTimes(2);
    expect((userBalanceCache.get(receiverID) ?? defaultUserBalance).debt).toBe(0);
    expect(transactionQueue[0].amount).toBe(20);
  });

  test('Pay debt with debt, but debt = transaction amount', async () => {
    const userBalanceCache : Map<string, IBalanceDebt> = new Map([[senderID, { balance: 0, debt: 0 }], [receiverID, { balance: 0, debt: 100 }]]);
    const debtHistoryCache: Map<string, IDebt> = new Map();
    const transactionQueue: ITransactionQueue[] = [{ uuid: "transaction1",
      fromID: senderID,
      toID: receiverID,
      amount: 100,
      originalAmount: 100,
      transType: TRANSTYPE.TRANSFER,
      debtID: null }];

    await transaction.payDebtWithDebt(userBalanceCache, transactionQueue[0], debtHistoryCache);

    expect(getUserDebtMock).toBeCalledTimes(2);
    expect((userBalanceCache.get(receiverID) ?? defaultUserBalance).debt).toBe(0);
    expect(transactionQueue[0].amount).toBe(0);
  });

  test('Pay debt with debt, but debt > transaction amount', async () => {
    const userBalanceCache : Map<string, IBalanceDebt> = new Map([[senderID, { balance: 0, debt: 0 }], [receiverID, { balance: 0, debt: 100 }]]);
    const debtHistoryCache: Map<string, IDebt> = new Map();
    const transactionQueue: ITransactionQueue[] = [{ uuid: "transaction1",
      fromID: senderID,
      toID: receiverID,
      amount: 80,
      originalAmount: 80,
      transType: TRANSTYPE.TRANSFER,
      debtID: null }];

    await transaction.payDebtWithDebt(userBalanceCache, transactionQueue[0], debtHistoryCache);

    expect(getUserDebtMock).toBeCalledTimes(2);
    expect((userBalanceCache.get(receiverID) ?? defaultUserBalance).debt).toBe(20);
    expect(transactionQueue[0].amount).toBe(0);
  });
});

// test('Test depositAndTranfer', async () => {
// const functionCalled = jest.spyOn(input, 'printHelp');
// await input.checkInput(rl, { uuid: "1A2B3C", name: 'Lorem' }, "help");
// expect(functionCalled).toHaveBeenCalled();
// });

describe('Test take money from sender', () => {
  test('Test take money, sender have enough balance', async () => {
    const userBalanceCache : Map<string, IBalanceDebt> = new Map([[senderID, { balance: 100, debt: 0 }]]);
    const debtHistoryCache: Map<string, IDebt> = new Map();
    const newDebtRecord: IDebt[] = [];
    const transactionQueue: ITransactionQueue[] = [{ uuid: "transaction1",
      fromID: senderID,
      toID: receiverID,
      amount: 100,
      originalAmount: 100,
      transType: TRANSTYPE.TRANSFER,
      debtID: null }];

    const getUserBalanceDebtMock = jest.spyOn(repositoriesTransaction, "getUserBalanceDebt");
    getUserBalanceDebtMock.mockImplementation(() => Promise.resolve({ balance: 0, debt: 0 }));

    const payDebtWithDebtMock = jest.spyOn(transaction, "payDebtWithDebt");
    payDebtWithDebtMock.mockImplementation(() => Promise.resolve());

    await transaction.takeMoneyFromSender(userBalanceCache, debtHistoryCache, newDebtRecord, transactionQueue[0]);

    expect(transactionQueue.length).toBe(1);
    expect(debtHistoryCache.size).toBe(0);
    expect(newDebtRecord.length).toBe(0);
    expect((userBalanceCache.get(senderID) ?? defaultUserBalance).debt).toBe(0);
  });

  test('Test take money, sender do not have enough balance', async () => {
    const userBalanceCache : Map<string, IBalanceDebt> = new Map([[senderID, { balance: 100, debt: 0 }]]);
    const debtHistoryCache: Map<string, IDebt> = new Map();
    const newDebtRecord: IDebt[] = [];
    const transactionQueue: ITransactionQueue[] = [{ uuid: "transaction1",
      fromID: senderID,
      toID: receiverID,
      amount: 120,
      originalAmount: 120,
      transType: TRANSTYPE.TRANSFER,
      debtID: null }];

    const getUserBalanceDebtMock = jest.spyOn(repositoriesTransaction, "getUserBalanceDebt");
    getUserBalanceDebtMock.mockImplementation(() => Promise.resolve({ balance: 0, debt: 0 }));

    const payDebtWithDebtMock = jest.spyOn(transaction, "payDebtWithDebt");
    payDebtWithDebtMock.mockImplementation(() => Promise.resolve());

    await transaction.takeMoneyFromSender(userBalanceCache, debtHistoryCache, newDebtRecord, transactionQueue[0]);

    expect(transactionQueue.length).toBe(1);
    expect(debtHistoryCache.size).toBe(0);
    expect(newDebtRecord.length).toBe(1);
    expect((userBalanceCache.get(senderID) ?? defaultUserBalance).debt).toBe(20);
  });
});
