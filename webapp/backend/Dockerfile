FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY src/ ./src/
RUN ls -la ./src/*

CMD [ "node", "src/main.js" ]

EXPOSE 3939