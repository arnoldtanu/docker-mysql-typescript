import { getUserIDAndBalance, register } from "../repositories/user";
import { printUserFinancialList } from "./transaction";

export const login = async (username : string) => {
  try {
    let data = await getUserIDAndBalance(username);
    if (data.uuid.length > 0) {
      console.log("Hello, " + username.toUpperCase() + "!");
      await printUserFinancialList(data.uuid, data);
      return {
        uuid: data.uuid,
        balance: data.balance,
      };
    } else {
      data = await register(username);
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
