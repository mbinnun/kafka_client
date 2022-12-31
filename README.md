## Description

Show KAFKA messages from a remote instance, in a web page (NestJS based)<br/>
*Note: requires NodeJS 16 and above*

## Installation

```bash
$ git clone https://github.com/mbinnun/kafka_client.git
$ cd kafka_client
$ npm install
$ npm run start:dev
```

Then navigate to *localhost:8000* to choose a topic

## Customization

Edit the file *config.ts* from the /src folder to edit the KAFKA configuration your needs<br/>
Edit the file *enums.ts* from the /src folder to define the topics for scanning

## Local KAFKA Environment

For testing purposes, you may want to build your local KAFKA environment, by running:

```bash
$ docker-compose -f docker-compose.yml up -d
```
