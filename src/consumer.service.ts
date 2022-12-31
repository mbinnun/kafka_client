import { Injectable } from '@nestjs/common';
import { kafka } from './config';
import { KafkaTopics } from './enums';
import { Consumer } from 'kafkajs';
​
@Injectable()
export class ConsumerService {
  // ==================================
  private groupId = 'kafka'; // ==> change this to the desired group id
  // ==> leave high timer lapses checks for remote kafka
  public timerLapseBegin = 20;
  public timerLapseOnFetch = 10;
  public maxAmountOfMessagesToAccept = 100; // ==> limiting the maximum number of consumed message to prevent "infinite" consumings
  // ==================================
  
  // kafka elements
  private consumer: Consumer;
  private kafka = kafka;
  // consuming timer
  private consumeTimer;
  public stoppedConsuming = true;
  // an array that will hold the consumed data
  public consumedData = [];
  
  // === Consume messages from kafka ===
  public consumeMessages = async (topic: string, isCommit: boolean) => {
    // force active consumer to stop, if still active for previous consumings
    this.stopConsuming();
    // reset consumed messages
    if (this.consumedData) { delete this.consumedData; }
    this.consumedData = [];
    this.stoppedConsuming = false;
    // connect the consumer
    this.consumer = this.kafka.consumer({ groupId: this.groupId });
    await this.consumer.connect();
    // prepare the topic
    const topics = topic ? [topic] : [ Object.values(KafkaTopics)[0] ];
    // subscribed to the current consumed topic
    await this.consumer.subscribe({topics: topics, fromBeginning: true});
    // run the consuming
    await this.consumer.run({autoCommit: isCommit, eachMessage: this.handleMessage});
    console.log('ConsumerService', '\n', 'Consuming has started, please wait 30-45 seconds ...', '\n', topics, '\n')
    // disconnection timer after 15 seconds of no new messages
    this.consumeTimer = setTimeout(this.stopConsuming, this.timerLapseBegin * 1000);
  };

  // === Stopping the consumer
  public stopConsuming = async () => {
    if (this.consumer) {
      // force stopping the consumer
      try { await this.consumer.stop(); } catch(e) {}
      // force disconnecting the consumer
      try { await this.consumer.disconnect(); } catch(e) {}
      // memory free
      delete this.consumer;
    }
    // mark the consumer as stopped
    console.log('ConsumerService', '\n', 'Consuming has stopped', '\n')
    this.stoppedConsuming = true;
  };

  public handleMessage = async ({ topic, partition, message }) => {
    // fetch consumed message
    const consumedDataItem = {
      topic: topic,
      partition: partition,
      offset: message.offset,
      headers: message.headers,
      key: message.key.toString(),
      value: JSON.parse(message.value.toString())
    };
    // save the consumed message
    this.consumedData.push(consumedDataItem);
    // reset the timer
    clearTimeout(this.consumeTimer);
    // check if we reached the limit, otherwise continue consuming (reset the timer lapse)
    if (this.consumedData.length <= this.maxAmountOfMessagesToAccept) {
      this.consumeTimer = setTimeout(this.stopConsuming, this.timerLapseOnFetch * 1000);
    } else {
      this.stopConsuming();
    }
  };
  
}

