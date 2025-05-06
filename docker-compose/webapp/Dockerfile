FROM node:latest

COPY entrypoint.sh /entrypoint.sh
RUN ["chmod", "+x", "/entrypoint.sh"]

WORKDIR /home/dvfapp

ENTRYPOINT ["/entrypoint.sh"]