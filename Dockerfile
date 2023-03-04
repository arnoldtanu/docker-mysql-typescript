FROM node:19-alpine
WORKDIR /app 
COPY package*.json ./ 
RUN npm install 
COPY . . 
RUN npm start