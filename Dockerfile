FROM node:8

RUN mkdir -p /app
WORKDIR /app

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

COPY src /app/src
RUN npm run build

EXPOSE 53/udp

VOLUME [ "/app/data" ]

CMD ["npm", "run", "start"]
