FROM node:alpine
MAINTAINER joeran.tesse@iteratec.de

ENV HTTP_PORT=8080
ENV NODE_ENV=production

ENV HOME /root

EXPOSE ${HTTP_PORT}

WORKDIR $HOME
COPY . $HOME
RUN cd $HOME && npm install && npm build
CMD ["npm","start"]
