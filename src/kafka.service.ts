import { Injectable } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { KafkaTopics } from './enums';

@Injectable()
export class KafkaService {
  constructor(
    private readonly ConsumerService: ConsumerService,
  ) {}

  // === Get the data from kafka and show it to the screen ===
  public async showKafkaData(req: any): Promise<string> {
        // interval of checking if accoplished (in sec)
        const timerLapseCheck = 0.5;
        // get the topic from query string
        let chosenTopic = null;
        let markAsRead = false;
        const queryParams: any = req.query;
        if (queryParams.topic) {
          // validte topic name
          const topicFromQuery: string = queryParams.topic.toString();
          const kafkaTopics = Object.values(KafkaTopics);
          for (let i = 0 ; i < kafkaTopics.length ; i++) {
            const kafkaTopic: string = kafkaTopics[i];
            // compare topic for input with lowercased available topics
            if (topicFromQuery.toLocaleLowerCase() === kafkaTopic.toLocaleLowerCase()) {
              // if found
              chosenTopic = kafkaTopic;
              break;
            }
          }
        }
        // if invalid topic
        if (!chosenTopic) {
          return this.buildDataTable([], 'INVALID_TOPIC', false);;  
        }
        // check whether to commit the consuming
        if (queryParams.commit && queryParams.commit.toString() === "1") {
          markAsRead = true;
        }
        // start consuming all messages from the beginning
        await this.ConsumerService.consumeMessages(chosenTopic, markAsRead);
        // wait some initial time
        await this.waitTime(this.ConsumerService.timerLapseBegin * 1000);
        // as long as not fully consumes, continue waiting ...
        while (!this.ConsumerService.stoppedConsuming) { await this.waitTime(timerLapseCheck * 1000); }
        // return consumed data
        return this.buildDataTable(this.ConsumerService.consumedData, chosenTopic, markAsRead);
  }

  // === Template to show the data ===
  private buildDataTable(data: any[], topic: string, markAsRead: boolean): string {
    let result: string = "";
    let options: string = "";
    const kafkaTopics = Object.values(KafkaTopics);
    // for invalid topic (or at the beginning) ==> force the user to choose a topic
    if (topic === 'INVALID_TOPIC') {
      options += `<option>--- Choose a topic ---</option>`;  
    }
    // list all the topics
    for (let i = 0 ; i < kafkaTopics.length ; i++) {
      const kafkaTopic = kafkaTopics[i];
      options += `
        <option value="${kafkaTopic}" ${(topic.toLocaleLowerCase()===kafkaTopic.toLocaleLowerCase() ? "selected" : "" )}>
          ${kafkaTopic}
        </option>
      `;
    }
    // for invalid topic - show a notification to choose a topic
    if (topic === 'INVALID_TOPIC') {
      result += `
        <tr>
          <td colspan="8" id="table_message">You have to choose a topic first!</td>
        </tr>
      `;
    }
    // if topic has no messages - show an appropitate notification
    if (data.length === 0 && topic !== 'INVALID_TOPIC') {
      result += `
        <tr>
          <td colspan="8" id="table_message">There are no messages that have not been already consumed<br/>for topic &quot;${topic}&quot;</td>
        </tr>
      `;
    }
    // placeholder for additional notifications
    if (data.length > 0 && topic !== 'INVALID_TOPIC') {
      result += `
        <tr id="table_message_row" style="display: none;">
          <td colspan="8" id="table_message"></td>
        </tr>
      `;
    }
    // if exceeded the maximum "allowed" amount of messages - show an appropriate notification
    if (data.length >= this.ConsumerService.maxAmountOfMessagesToAccept && topic !== 'INVALID_TOPIC') {
      result += `
        <tr class="data_message_row">
          <td colspan="8" id="table_message">
            Exceeded maximum buffer length of ${this.ConsumerService.maxAmountOfMessagesToAccept} messages for topic: ${topic}!<br/>
            Commit some of your messages as consumed, to fetch the rest of the topic.
          </td>
        </tr>
      `;
    }
    // show a warning if shown message have been commited (when commit flag is on)
    if (data.length > 0 && topic !== 'INVALID_TOPIC' && markAsRead) {
      result += `
        <tr class="data_message_row">
          <td colspan="8" id="table_message">
            Attention: The following messages were <b>commited as consumed</b><br/>
            and will not show again on the next topic scans.
          </td>
        </tr>
      `;
    }
    // iterate the messages returned from kafka
    for (let dataItem of data) {
      const mainpulatedHeader = this.commaLineBreak(JSON.stringify(dataItem.value.header ? dataItem.value.header : {}).substring(0,250));
      let mainpulatedValue = JSON.stringify(dataItem.value._data ? dataItem.value._data : {});
      if (mainpulatedValue.indexOf("<?xml version=") > -1) {
        mainpulatedValue = dataItem.value._data;
      }
      mainpulatedValue = this.commaLineBreak(this.escapeHtmlChars(mainpulatedValue.substring(0,500)));
      result += `
        <tr class="data_message_row">
          <td>${dataItem.topic}</td>
          <td>${dataItem.partition}</td>
          <td>${dataItem.offset}</td>
          <td>${dataItem.key}</td>
          <td>${dataItem.value.action}</td>
          <td>${dataItem.value.entity_type}</td>
          <td><pre>${mainpulatedHeader}</pre>...</td>
          <td><pre>${mainpulatedValue}</pre>...</td>
        </tr>
      `;
    }
    // wrap up the results to an HTML page
    result = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>${(topic === 'INVALID_TOPIC' ? 'Choose a Kafka topic' : topic + ' - Kaka Data' )}</title>
          <style>
            body { font-size: 13px; }
            h1 { display: block; margin: 0 auto; text-align: center; }
            select { width: 250px; }
            th { font-weight: bold; background-color: #ccc; }
            td { word-break: break-all; max-width: 500px; max-height: 300px; overflow: hidden; }
            div { margin: 10px auto; text-align: center; }
            table { margin: 0 auto; width: 90%; }
            #table_message { font-size: 28px; color: gray; text-align: center; }
            .loader {
              border: 6px solid #f3f3f3;
              border-radius: 50%;
              border-top: 6px solid #3498db;
              width: 20px;
              height: 20px;
              -webkit-animation: spin 2s linear infinite; /* Safari */
              animation: spin 2s linear infinite;
              display: inline-block;
              margin: 0 0 0 16px;
              padding: 0;
            }
            
            /* Safari */
            @-webkit-keyframes spin {
              0% { -webkit-transform: rotate(0deg); }
              100% { -webkit-transform: rotate(360deg); }
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
          <script>
            function onChangeTopic(strTopic) {
              document.getElementById("koteret").innerHTML = "Loading topic data, please wait (30-45 seconds) ... <div class=loader></div>"; 
              document.getElementById("koteret").style.color = "blue"; 
              document.title="Loading Topic..."; 
              if(document.getElementById("table_message")) {
                document.getElementById("table_message").innerHTML = "Please wait ..."; 
              } 
              if(document.getElementById("table_message_row")) { 
                document.getElementById("table_message_row").style.display = "table-row"; 
              }
              const dataRows = document.querySelectorAll(".data_message_row");
              for (let i = 0 ; i < dataRows.length ; i++) {
                dataRows[i].style.display = "none";
              }
              let locationLink = "/?topic="+strTopic;
              if (document.getElementById("commit") && document.getElementById("commit").checked) {
                locationLink += "&commit=1";
              }
              if (document.getElementById("reload")) {
                document.getElementById("reload").disabled = true;
              }
              window.location.href = locationLink;
            }
          </script>
        </head>
        <body>
          <h1 id="koteret" ${(topic === 'INVALID_TOPIC' ? 'style="color: red;"' : '' )}>
            ${(topic === 'INVALID_TOPIC' ? 'Please choose a Kafka topic' : 'Kafka data for topic: ' + topic )}
          </h1>
          <div>
            <input type="checkbox" name="commit" id="commit" />&nbsp;check here to <b>commit as consumed</b> when choosing a topic (not recommended)
            <br /><br />
            <select name="topic" id="topic" onchange='onChangeTopic(this.value)'>${options}</select>${(topic === 'INVALID_TOPIC' ? '' : `&nbsp;&nbsp;&nbsp;<button id="reload" onclick='onChangeTopic(document.getElementById("topic").value);'>fetch again</button>` )}
            <br /><br />
          </div>
          <table cellpadding="5" cellspacing="0" border="1">
            <tr>
              <th>Topic</th>
              <th>Partition</th>
              <th>Offset</th>
              <th>Key</th>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Header</th>
              <th>Value</th>
            </tr>
            ${result}
          </table>
        </body>
      </html>
    `;
    return result;
  }

  // === since we want to show a raw data, we need to escape some HTML chars ===
  private escapeHtmlChars(html: string): string {
    let result = html;
    result = result.split('<').join('&lt;');
    result = result.split('>').join('&gt;');
    result = result.split('"').join('&quot;');
    result = result.split('\'').join('&rsquo;');
    result = result.split('\0').join('');
    return result;
  }

  // === since there are long JSON results, we need some line-breaks ===
  private commaLineBreak(text: string): string {
    let result = text;
    result = result.split(',').join(','+'\n');
    return result;
  }

  // === promised timers (to specify waiting times) ===
  private waitAndReturnValue(delay: number, value: any): any {
    return new Promise(resolve => setTimeout(resolve, delay, value));
  }
  private async waitTime(miliSec: number) {
    await this.waitAndReturnValue(miliSec, null);
  }

}
