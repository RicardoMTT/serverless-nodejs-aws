const AWS = require('aws-sdk');
const sns = new AWS.SNS();

class NotificationService {
  async publishToSNS(topicArn:string, message:any, messageAttributes:any) {
    await sns
      .publish({
        TopicArn: topicArn,
        Message: JSON.stringify(message),
        MessageAttributes: messageAttributes
      })
      .promise();
  }
}

export default NotificationService;