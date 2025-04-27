const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

class DynamoRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async saveAppointment(appointmentData) {
    await dynamoDB
      .put({
        TableName: this.tableName,
        Item: appointmentData,
      })
      .promise();
  }


  async updateAppointmentStatus(appointmentId, status) {
    await dynamoDB.update({
      TableName: this.tableName,
      Key: { appointmentId },
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status },
    }).promise();
  }
}

module.exports = DynamoRepository;