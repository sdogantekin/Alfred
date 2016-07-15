FROM node:0.12
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install
# Bundle app source
COPY . /usr/src/app
# Port used by app
EXPOSE 8080
# Run app
CMD [ "npm", "start" ]