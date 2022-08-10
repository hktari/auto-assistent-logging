FROM node:16

RUN apt-get install
RUN install libnss
RUN install libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev


WORKDIR /usr/src/app

COPY . .

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
 

CMD [ "npm", "run" , "start" ]