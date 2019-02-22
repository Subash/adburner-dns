FROM node:10

RUN mkdir -p /app
WORKDIR /app

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install --production

COPY src /app/src

EXPOSE 53/udp

CMD ["npm", "run", "start"]
