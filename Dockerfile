FROM node:latest
RUN apt update && apt install nano mc -y
WORKDIR /var/photobank_api
COPY . .
RUN npm install -g npm@latest && \
    npm install pm2@latest -g && \
    pm2 update && \
    npm install
EXPOSE 80
CMD [ "pm2-runtime", "start", "app.config.js" ]