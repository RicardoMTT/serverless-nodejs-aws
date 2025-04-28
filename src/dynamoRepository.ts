const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

class DynamoRepository {
  private tableName:string;
  constructor(tableName:string) {
    this.tableName = tableName;
  }

  async saveAppointment(appointmentData:any) {
    await dynamoDB
      .put({
        TableName: this.tableName,
        Item: appointmentData,
      })
      .promise();
  }


  async updateAppointmentStatus(appointmentId:string, status:string) {
    await dynamoDB.update({
      TableName: this.tableName,
      Key: { appointmentId },
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status },
    }).promise();
  }
}

export default DynamoRepository;
