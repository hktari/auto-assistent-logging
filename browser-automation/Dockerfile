FROM node:14

WORKDIR /usr/src/app

COPY . .

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
 

CMD [ "npm", "run" , "start" ]