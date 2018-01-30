FROM node:alpine
MAINTAINER joeran.tesse@iteratec.de

ENV HOST mongo
ENV PORT 27017
ENV TUNNEL 9958
ENV SECRET I solemnly swear that I am up to no good
ENV IS-SERVER true

ENV HOME /root

EXPOSE ${PORT}

WORKDIR $HOME
COPY . $HOME
RUN cd $HOME && npm install
CMD ["npm","start"]
