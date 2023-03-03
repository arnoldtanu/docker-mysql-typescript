import * as readline from "readline";
import { deposit, transfer, withdraw } from "../service/transaction";
import { login } from "../service/user";
import { IUser } from "../helper/interfaces";

const askInput = async () => {
  return new Promise(function(resolve) {
    const currentUser : IUser = {
      name: "",
      uuid: "",
    };
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt('> ');
    rl.prompt();
    rl.on('line', function(originalLine:string) {
      checkInput(rl, currentUser, originalLine);
    }).on('close', function() {
      resolve(true);
    });
  });
};

const checkInput = async (rl: readline.Interface, currentUser:IUser, userInput : string) => {
  const command = userInput.split(" ");
  command[0] = command[0].toLocaleLowerCase();
  if (command[0] === "exit" || command[0] === "quit" || command[0] == 'q') {
    rl.close();
    return;
  } else if (command[0] === "help" || command[0] === '?') {
    printHelp();
  } else if (command[0] === "logout") {
    console.log("Goodbye, " + currentUser.name + "!");
    changeCurrentUser(currentUser);
    rl.setPrompt('> ');
  } else if (command[0] === "login") {
    if (typeof command[1] === "string" && command[1] != "") {
      const foundUser = await login(command[1]);
      if (foundUser?.uuid) { changeCurrentUser(currentUser, command[1], foundUser.uuid); }
      rl.setPrompt(currentUser.name + "> ");
    } else {
      console.log("wrong login command, please use HELP command for more information.");
    }
  } else if (command[0] === "deposit") {
    if (validateCommand(currentUser, command, 2)) await deposit(currentUser.uuid, parseInt(command[1]));
  } else if (command[0] === "transfer") {
    if (validateCommand(currentUser, command, 3)) await transfer(currentUser.uuid, command[1], parseInt(command[2]));
  } else if (command[0] === "withdraw") {
    if (validateCommand(currentUser, command, 2)) await withdraw(currentUser.uuid, parseInt(command[1]));
  } else {
    console.log(`unknown command: "${userInput}"`);
  }
  rl.prompt();
};

const validateCommand = (currentUser:IUser, command: string[], numRequiredParams: number) => {
  if ((command.length != numRequiredParams) || (numRequiredParams === 3 && command[1] === "")) {
    console.log("wrong command, please use HELP command for more information.", command.length, numRequiredParams - 1);
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

const printHelp = () => {
  console.log(`commands:\n  
  * 'login [name]' - Logs in as this customer and creates the customer if not exist\n
  * 'deposit [amount]' - Deposits this amount to the logged in customer\n
  * 'withdraw [amount]' - Withdraws this amount from the logged in customer\n
  * 'transfer [target] [amount]' - Transfers this amount from the logged in customer to the target customer\n
  * 'logout' - Logs out of the current customer\n
  * 'exit' or 'quit' - Exit from ATM\n`);
};

const changeCurrentUser = (currentUser:IUser, name?:string, uuid?:string) => {
  if (name && uuid) {
    currentUser.name = name;
    currentUser.uuid = uuid;
  } else {
    currentUser.name = "";
    currentUser.uuid = "";
  }
};

export default askInput;