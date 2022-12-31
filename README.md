## Description

Show KAFKA messages from a remote instance (NestJS based)<br/>
*Note: requires NodeJS 16 and above*

## Installation

```bash
$ git clone https://github.com/mbinnun/kafka_client.git
$ cd kafka_client
$ npm install
$ npm run start:dev
```
## Customization

Edit the file *config.ts* from the /src folder to your needs

## Local KAFKA Environment

For testing purposes, you may want to build your local KAFKA environment, by running:

```bash
$ docker-compose -f docker-compose.yml up -d
```
