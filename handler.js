
const DynamoRepository = require('./dynamoRepository');
const MySqlRepository = require('./mysqlRepository');
const NotificationService = require('./notificationService');


// Crear una conexión a RDS
const dbConfig = {
  host: 'test.crbwbjdd2jat.us-east-1.rds.amazonaws.com',
  user: 'root',
  password: 'Indiegente003',
  database: 'test'
};

// Inicializar repositorios y servicios
const dynamoRepo = new DynamoRepository('appointments');
const mysqlRepo = new MySqlRepository(dbConfig);
const notificationService = new NotificationService();


module.exports.appointment = async (event) => {
  try {
    
    const { insuredId, scheduleId, countryISO } = JSON.parse(event.body);

    if (countryISO !== 'PE' && countryISO !== 'CL') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid countryISO. Must be "PE" or "CL".' }),
      };
    }

    // Preparamos id para DynamoDB
    const appointmentId = `appt-${Date.now()}`;
    
    const appointmentData = {
      appointmentId,
      insuredId,
      scheduleId,
      countryISO,
      status: 'pending',
    };

    await dynamoRepo.saveAppointment(appointmentData);
    
    // Determinar cual topic sns usar basado en el campo countryISO
    let snsTopicArn;
    if (countryISO === 'PE') {
      snsTopicArn = process.env.SNS_TOPIC_PE;
    } else if (countryISO === 'CL') {
      snsTopicArn = process.env.SNS_TOPIC_CL;
    }

    // Enviar a SNS
    const snsMessage = {
      appointmentId,
      insuredId,
      scheduleId,
      countryISO,
    };

    const messageAttributes = {
      countryISO: {
        DataType: 'String',
        StringValue: countryISO
      }
    };

    await notificationService.publishToSNS(snsTopicArn, snsMessage, messageAttributes);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'La cita esta siendo procesada.' }),
    };
  
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Un error ocurrio mientras se proceso la cita.' }),
    };
  }
};

module.exports.appointmentPe = async (event) => {
  
  try {
    // Se puede agregar logica personalizada para clientes PERU

    await processAppointmentRecords(event);
    return { statusCode: 200, body: JSON.stringify({ message: 'Datos guardados en RDS correctamente.' }) };
  } catch (error) {
    console.error('Error al procesar el mensaje:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error al guardar datos en RDS.', error: error.message }) };
  }

};

module.exports.appointmentCl = async (event) => {
  try {
    // Se puede agregar logica personalizada para clientes CHILE

    await processAppointmentRecords(event);
    return { statusCode: 200, body: JSON.stringify({ message: 'Datos guardados en RDS correctamente.' }) };
  
  } catch (error) {
    console.error('Error processing message:', error);
    return { statusCode: 500, body: 'Error storing data in RDS.' };
  }
};


async function processAppointmentRecords(event) {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);

    let messageData;
    if (body.Message) {
      messageData = JSON.parse(body.Message);
    } else {
      messageData = body;
    }

    const { appointmentId, insuredId, scheduleId, countryISO } = messageData;

    if (!appointmentId || !insuredId || !scheduleId || !countryISO) {
      throw new Error(`Datos incompletos: ${JSON.stringify(messageData)}`);
    }

    const result = await mysqlRepo.saveAppointment(appointmentId, insuredId, scheduleId, countryISO, 'pending');
    await dynamoRepo.updateAppointmentStatus(appointmentId, 'completed');

    console.log('Datos insertados en RDS:', result);
  }
}
