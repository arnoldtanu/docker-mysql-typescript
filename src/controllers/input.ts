import * as readline from "readline";
import { deposit, transfer, withdraw } from "../services/transaction";
import { login } from "../services/user";
import { IUser } from "../helpers/interfaces";
import { capitalizeFirstLetter } from "../helpers/common_helper";

export const checkInput = async (rl: readline.Interface, currentUser:IUser, userInput : string) => {
  const command = userInput.split(" ");
  command[0] = command[0].toLocaleLowerCase();
  switch (command[0]) {
    case "exit":
    case "quit":
    case "q":
      rl.close();
      return;
    case "help":
    case "?":
      printHelp();
      break;
    case "logout":
      console.log("Goodbye, " + capitalizeFirstLetter(currentUser.name) + "!");
      changeCurrentUser(currentUser);
      rl.setPrompt('> ');
      break;
    case "login":
      if (typeof command[1] === "string" && command[1] != "") {
        const foundUser = await login(command[1]);
        if (foundUser?.uuid) { changeCurrentUser(currentUser, command[1], foundUser.uuid); }
        rl.setPrompt(currentUser.name + "> ");
      } else {
        console.log("wrong login command, please use HELP command for more information.");
      }
      break;
    case "deposit":
      if (validateCommand(currentUser, command, 2)) await deposit(currentUser.uuid, parseInt(command[1]));
      break;
    case "transfer":
      if (validateCommand(currentUser, command, 3)) await transfer(currentUser.uuid, command[1], parseInt(command[2]));
      break;
    case "withdraw":
      if (validateCommand(currentUser, command, 2)) await withdraw(currentUser.uuid, parseInt(command[1]));
      break;
    default:
      console.log(`unknown command: "${userInput}"`);
  }
  console.log("");
  rl.prompt();
};

export const validateCommand = (currentUser:IUser, command: string[], numRequiredParams: number) => { //TODO: taruh dek folder validator, tp masih ok kl disini
  if ((command.length != numRequiredParams) || (numRequiredParams === 3 && command[1] === "")) {
    console.log("wrong command, please use HELP command for more information.");//TODO: console log error, ganti ke throw error
    return false;
  } else if (parseInt(command[command.length - 1]) <= 0 || isNaN(parseInt(command[command.length - 1]))) {
    console.log("amount must be numeric and greater than 0");
    return false;
  } else if (currentUser.uuid.length <= 0) {
    console.log("please login first");
    return false;
  }
  return true;
};

export const printHelp = () => {
  console.log(`commands:\n  
  * 'login [name]' - Logs in as this customer and creates the customer if not exist\n
  * 'deposit [amount]' - Deposits this amount to the logged in customer\n
  * 'withdraw [amount]' - Withdraws this amount from the logged in customer\n
  * 'transfer [target] [amount]' - Transfers this amount from the logged in customer to the target customer\n
  * 'logout' - Logs out of the current customer\n
  * 'exit' or 'quit' - Exit from ATM\n`);
};

export const changeCurrentUser = (currentUser:IUser, name?:string, uuid?:string) => {
  if (name && uuid) {
    currentUser.name = name;
    currentUser.uuid = uuid;
  } else {
    currentUser.name = "";
    currentUser.uuid = "";
  }
};