import * as input from "./input";
import * as readline from "readline";

describe('Test Controller', () => {
  const rl = readline.createInterface(process.stdin, process.stdout);

  test('Test Input help', async () => {
    const functionCalled = jest.spyOn(input, 'printHelp');
    await input.checkInput(rl, { uuid: "1A2B3C", name: 'Lorem' }, "help");
    expect(functionCalled).toHaveBeenCalled();
  });

  test('Test Input logout', async () => {
    const functionCalled = jest.spyOn(input, 'changeCurrentUser');
    await input.checkInput(rl, { uuid: "1A2B3C", name: 'Lorem' }, "logout");
    expect(functionCalled).toBeCalled();
  });

  test('Test Input validate command 1', async () => {
    const data = input.validateCommand({ uuid: "1A2B3C", name: 'Lorem' }, "deposit aaaa".split(" "), 2);
    expect(data).toEqual(false);
  });

  test('Test Input validate command 2', async () => {
    const data = input.validateCommand({ uuid: "1A2B3C", name: 'Lorem' }, "deposit 10".split(" "), 2);
    expect(data).toEqual(true);
  });

  test('Test Input validate command 3', async () => {
    const data = input.validateCommand({ uuid: "1A2B3C", name: 'Lorem' }, "transfer  10".split(" "), 3);
    expect(data).toEqual(false);
  });

  test('Test Input validate command 4', async () => {
    const data = input.validateCommand({ uuid: "1A2B3C", name: 'Lorem' }, "transfer joko ten".split(" "), 3);
    expect(data).toEqual(false);
  });

  test('Test Input validate command 5', async () => {
    const data = input.validateCommand({ uuid: "1A2B3C", name: 'Lorem' }, "transfer joko 10".split(" "), 3);
    expect(data).toEqual(true);
  });

  test('Test Input exit', async () => {
    const functionCalled = jest.spyOn(rl, 'close');
    await input.checkInput(rl, { uuid: "1A2B3C", name: 'Lorem' }, "exit");
    expect(functionCalled).toHaveBeenCalled();
  });

});