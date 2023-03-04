import { checkInput } from "./controllers/input";
import { IUser } from "./helpers/interfaces";
import * as readline from "readline";

const run = async () => {
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
    console.log("---");
  });
};
run();