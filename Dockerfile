FROM node:8

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install

COPY src /usr/src/app/src
RUN npm run compile-src

EXPOSE 53/udp

VOLUME [ "/usr/src/app/data" ]

CMD ["npm", "run", "start"]
