#Mini ATM

An ATM simulation program that can send and receive virtual money and make transfers to friends, both as debt and cash.

## Getting Started

This app can be run through docker, or not, here is how to run it:

#### 1. Using docker

- Clone this project.
- Download docker desktop from https://www.docker.com/products/docker-desktop/ and install it.
- Enter the root folder, and run command inside terminal / cmd:
```
docker-compose up --build
```
- Docker compose will download and build necesary image (nodeJS and mysql).
- Open new terminal / cmd, and run:
```
docker exec -it web-atm /bin/sh
```
- After entering the docker CLI, enter the following command to run the project's unit test:
```
npm test
```
- Or use the following command to run the actual project:
```
npm start
```

#### 2. Without using docker
- Clone this project.
- Please install nodeJS and the database on your computer, mysql or mariaDB can be used in this project.
- Rename file `.env.example` to `.env` to setup the database connection, change the values according to your database settings:
```
DB_HOST=db
DB_DATABASE=atm
DB_USERNAME=root
DB_PASSWORD=password
```
- SQL commands about table structure can be found in the folder: `[root]/db/db.sql`
- Using your terminal / cmd, enter the root folder, and run this command to install dependencies:
```
npm install
```
- To run the project's unit test use this command:
```
npm test
```
- Or use the following command to run the actual project:
```
npm start
```

## Command List
  * `help` or `?` - List avaiable commands
  * `login [name]` - Logs in as this customer and creates the customer if not exist
  * `deposit [amount]` - Deposits this amount to the logged in customer
  * `withdraw [amount]` - Withdraws this amount from the logged in customer
  * `transfer [target] [amount]` - Transfers this amount from the logged in customer to the target customer
  * `logout` - Logs out of the current customer
  * `exit` or `quit` or `q` - Exit from ATM

## Build With
- [nodeJS](https://nodejs.org/en/download/)
- [typescript](https://www.typescriptlang.org/)
- [eslint](https://eslint.org/)
- [jest](https://jestjs.io/)
- [nodemon](https://nodemon.io/)
