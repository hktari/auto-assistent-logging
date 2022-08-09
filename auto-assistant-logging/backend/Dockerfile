FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY src/ ./src/
COPY .env ./

RUN ls -la ./src/*

CMD [ "node", "src/aal-server.js" ]

EXPOSE 3939