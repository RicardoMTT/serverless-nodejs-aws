const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const sns = new AWS.SNS();
const sqs = new AWS.SQS();

const mysql = require('mysql2');

// Crear una conexión a RDS
const dbConfig = {
  host: 'test.crbwbjdd2jat.us-east-1.rds.amazonaws.com',
  user: 'root',
  password: 'Indiegente003',
  database: 'test'
};

module.exports.appointment = async (event) => {
  try {
    // Parse the body of the incoming request
    const { insuredId, scheduleId, countryISO } = JSON.parse(event.body);

    // Validation: ensure valid countryISO (PE or CL)
    if (countryISO !== 'PE' && countryISO !== 'CL') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid countryISO. Must be "PE" or "CL".' }),
      };
    }

    // Prepare data for DynamoDB
    const appointmentId = `appt-${Date.now()}`;
    const appointmentData = {
      appointmentId,
      insuredId,
      scheduleId,
      countryISO,
      status: 'pending',
    };
    console.log(`Creating appointment ${appointmentId} to "completed"`);

    //appt-1745697893784
    // Save to DynamoDB
    await dynamoDB
      .put({
        TableName: 'appointments',
        Item: appointmentData,
      })
      .promise();

    // Determine which SNS topic and SQS queue to use based on countryISO
    let snsTopicArn, sqsQueueUrl;
    if (countryISO === 'PE') {
      snsTopicArn = process.env.SNS_TOPIC_PE;
      sqsQueueUrl = process.env.SQS_PE;
    } else if (countryISO === 'CL') {
      snsTopicArn = process.env.SNS_TOPIC_CL;
      sqsQueueUrl = process.env.SQS_CL;
    }

    // Send to SNS
    const snsMessage = {
      appointmentId,
      insuredId,
      scheduleId,
      countryISO,
    };
    await sns
      .publish({
        TopicArn: snsTopicArn,
        Message: JSON.stringify(snsMessage),
      })
      .promise();

    // Send to SQS
    const sqsMessage = {
      QueueUrl: sqsQueueUrl,
      MessageBody: JSON.stringify(snsMessage),
    };
    await sqs.sendMessage(sqsMessage).promise();

    // Return response to the user
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'The appointment is being processed.' }),
    };
  } catch (error) {
    console.error('Error occurred:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'An error occurred while processing the appointment.' }),
    };
  }
};

module.exports.appointmentPe = async (event) => {
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const { appointmentId, insuredId, scheduleId, countryISO } = message;

      const connection =  mysql.createConnection(dbConfig);

      const query = 'INSERT INTO appointments (appointment_id, insured_id, schedule_id, country_iso, status) VALUES (?, ?, ?, ?, ?)';
      const [rows, fields] = await connection.promise().execute(query, [appointmentId, insuredId, scheduleId, countryISO, 'pending']);
      console.log('Resultado de connection.execute:', rows); // Ahora sí, usando [rows, fields]

      console.log(`Updating appointment ${appointmentId} to "completed"`);

      // Paso 2: Actualizar el estado en DynamoDB
      await dynamoDB.update({
        TableName: 'appointments',
        Key: { appointmentId },
        UpdateExpression: 'set #s = :s',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':s': 'completed' },
      }).promise();

      await connection.end();
      return { statusCode: 200, body: 'Data stored in RDS successfully.' };

    }

    return { statusCode: 200, body: 'Data stored in RDS successfully.' };
  } catch (error) {
    console.error('Error processing message:', error);
    return { statusCode: 500, body: 'Error storing data in RDS.' };
  }
};

module.exports.appointmentCl = async (event) => {
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const { appointmentId, insuredId, scheduleId, countryISO } = message;

      const connection = await mysql.createConnection(dbConfig);

      const query = 'INSERT INTO appointments (appointment_id, insured_id, schedule_id, country_iso, status) VALUES (?, ?, ?, ?, ?)';
      const [rows, fields] = await connection.execute(query, [appointmentId, insuredId, scheduleId, countryISO, 'pending']);
      console.log('Data inserted successfully:', rows); // Modificado para usar 'rows'

      await connection.end();
    }

    return { statusCode: 200, body: 'Data stored in RDS successfully.' };
  } catch (error) {
    console.error('Error processing message:', error);
    return { statusCode: 500, body: 'Error storing data in RDS.' };
  }
};