FROM node:alpine
MAINTAINER joeran.tesse@iteratec.de

ENV HTTP_PORT=8070  NODE_ENV=production HOME=/root

EXPOSE ${HTTP_PORT}

WORKDIR $HOME
COPY . $HOME
RUN cd $HOME && npm install && npm build && echo build done;
CMD ["npm","start"]
