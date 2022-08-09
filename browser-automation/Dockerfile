FROM node:16

WORKDIR /usr/src/app

COPY ./src/ ./src/

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
 

CMD [ "node", "./src/main.js" ]