FROM node:lts-alpine

ENV HOME=/home/node/app
ENV NODE_ENV=production
ENV NODE_PORT=1234

RUN mkdir -p $HOME && chown -R node:node $HOME

WORKDIR $HOME
USER node

COPY --chown=node:node package.json $HOME/
RUN npm install && npm cache clean --force

COPY --chown=node:node . .

RUN npm run build
RUN npm run tsc

EXPOSE $NODE_PORT:80

CMD ["node", "dist/index.js"]