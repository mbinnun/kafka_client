import * as kafkajs from "kafkajs";
​
export const kafka = new kafkajs.Kafka({
  clientId: "kafka", // ==> change this to the desired client id
  brokers: [
    // ==> edit according to your kafka brokers
    "localhost:9092",
  ],
  // leave high timeouts for remote kafka, you may reduce them when using localhost
  connectionTimeout: 30000,
  authenticationTimeout: 30000,
  ssl: false, // ==> change to true if you use encryption
  retry: {
    initialRetryTime: 100,
    retries: 2,
   },
});
