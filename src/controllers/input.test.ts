import { checkInput } from "./input";
import * as readline from "readline";

describe('Test Controller', () => {
  const rl = readline.createInterface(process.stdin, process.stdout);

  // test('Test Input help', async () => {
  //   // const printHelp = jest.fn().mockImplementation();
  //   await checkInput(rl, { uuid: "1A2B3C", name: 'Lorem' }, "help");
  //   // rl.close();
  //   expect(printHelp).toHaveBeenCalled();
  // });

  // test('Test Input logout', async () => {
  //   const changeCurrentUser = jest.fn();
  //   await checkInput(rl, { uuid: "1A2B3C", name: 'Lorem' }, "logout");
  //   // rl.close();
  //   expect(changeCurrentUser).toBeCalled();
  // });

  test('Test Input exit', async () => {
    await checkInput(rl, { uuid: "1A2B3C", name: 'Lorem' }, "exit");
    expect(rl.close()).toBeCalled();
  });

});