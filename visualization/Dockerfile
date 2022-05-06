FROM node:latest
RUN mkdir -p /usr/src/app
RUN mkdir -p /usr/src/app/src
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY ./src /usr/src/app/src
CMD ["npm", "run", "production"]
