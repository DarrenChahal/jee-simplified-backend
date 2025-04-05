import { PubSub } from '@google-cloud/pubsub';

class PubSubPublisher {
  constructor(projectId, topicName) {
    this.pubsubClient = new PubSub({ projectId });
    this.topic = this.pubsubClient.topic(topicName, { messageOrdering: true });
  }

  // Publishes an event with a specified event type and payload.
  async publishEvent(eventType, payload, orderingKey = '') {
    const messageData = {
      eventType, // e.g., 'question_create' or 'question_update' or 'answer_create' or 'answer_update'
      payload,   // the question data or answer data
      timestamp: Date.now()
    };
    const dataBuffer = Buffer.from(JSON.stringify(messageData));
    const messageOptions = { data: dataBuffer };
    if (orderingKey) {
      messageOptions.orderingKey = orderingKey;
    }
    const messageId = await this.topic.publishMessage(messageOptions);
    return messageId;
  }
}

export default PubSubPublisher;
