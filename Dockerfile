FROM node:18

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

EXPOSE 3000

# Start the application
CMD ["npm", "run", "serve"]