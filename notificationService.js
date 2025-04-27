const AWS = require('aws-sdk');
const sns = new AWS.SNS();

class NotificationService {
  async publishToSNS(topicArn, message, messageAttributes) {
    await sns
      .publish({
        TopicArn: topicArn,
        Message: JSON.stringify(message),
        MessageAttributes: messageAttributes
      })
      .promise();
  }
}

module.exports = NotificationService;