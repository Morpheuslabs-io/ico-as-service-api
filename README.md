# API Server

Provides rest APIs for admin- and user boards

## Installation 

### Dependencies

`yarn install`

### MongoDB

**Link:** https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

## Configuration

  - Copy the template file `.env.example` into own file `.env`

  - Example: `PORT=3777`

## System start

### Start MongoDB

  - cmd: `pm2 start pm2/script_start_mongo.sh`

  - MongoDB server listens at: `localhost:27017`

### Start server (production)

  - in background:  `yarn start`

  - Server listens at: `localhost:3777`

### Start server (development)

  - in foreground:  `yarn dev`

  - Server listens at: `localhost:3777`
