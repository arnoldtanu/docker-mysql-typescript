import { capitalizeFirstLetter } from "../helpers/common_helper";
import { getUserIDAndBalance, IUserIDAndBalance, register } from "../repositories/user";
import { printUserFinancialList } from "./transaction";

const sayHello = async (username: string, data:IUserIDAndBalance) => {
  console.log("Hello, " + capitalizeFirstLetter(username) + "!");
  await printUserFinancialList(data.uuid, data);
};

export const login = async (username : string) => {
  try {
    let data = await getUserIDAndBalance(username);
    if (data.uuid.length > 0) {
      await sayHello(username, data);
      return {
        uuid: data.uuid,
        balance: data.balance,
      };
    } else {
      data = await register(username);
      await sayHello(username, data);
      return {
        uuid: data.uuid,
        balance: data.balance,
      };
    }
  } catch (e) {
    console.log("error:", e);
  }
};

export const checkUser = async (username : string) => {
  try {
    let data = await getUserIDAndBalance(username);
    if (data.uuid.length > 0) {
      return {
        uuid: data.uuid,
        balance: data.balance,
        debt: data.debt,
      };
    }
  } catch (e) {
    console.log("error:", e);
  }
};
