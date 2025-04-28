// Importar dependencias
import MySqlRepository from "./mysqlRepository";
import NotificationService from "./notificationService";
import DynamoRepository from "./dynamoRepository";
import { AppointmentRequest, Appointment, AppointmentResponse, ErrorResponse } from "./types";
  
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const eventBridgeClient = new EventBridgeClient({ region: "us-east-1" });

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


export const getAppointments = async (event: any) => {
  try {
    const { countryISO } = event.pathParameters;

    if (countryISO !== 'PE' && countryISO !== 'CL') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid countryISO. Must be "PE" or "CL".' } as ErrorResponse),
      };
    }

    const appointments = await mysqlRepo.getAppointmentsByCountry(countryISO);
    
    return {
      statusCode: 200,
      body: JSON.stringify(appointments),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'An error occurred while fetching appointments.' } as ErrorResponse),
    };
  }
};

export const appointment = async (event: any) => {
  try {
    const { insuredId, scheduleId, countryISO } = JSON.parse(event.body) as AppointmentRequest;

    if (countryISO !== 'PE' && countryISO !== 'CL') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid countryISO. Must be "PE" or "CL".' } as ErrorResponse),
      };
    }

    // Preparamos id para DynamoDB
    const appointmentId = `appt-${Date.now()}`;
    
    const appointmentData: Appointment = {
      appointmentId,
      insuredId,
      scheduleId,
      countryISO,
      status: 'pending',
    };

    // Se guarda la cita en DynamoDB
    await dynamoRepo.saveAppointment(appointmentData);
    
    // Determinar cual topic sns enviar basado en el campo countryISO
    let snsTopicArn = process.env.SNS_TOPIC_PE || '';
    if (countryISO === 'PE') {
      snsTopicArn = process.env.SNS_TOPIC_PE || '';
    } else if (countryISO === 'CL') {
      snsTopicArn = process.env.SNS_TOPIC_CL || '';
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
      body: JSON.stringify({ message: 'La cita esta siendo procesada.' } as AppointmentResponse),
    };
  
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Un error ocurrio mientras se proceso la cita.' } as ErrorResponse),
    };
  }
};

export const appointmentPe = async (event: any) => {
  try {
    // Se puede agregar logica personalizada para clientes PERU
    await processAppointmentRecords(event);
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Datos guardados en RDS correctamente.' } as AppointmentResponse) 
    };
  } catch (error: any) {
    console.error('Error al procesar el mensaje:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        message: 'Error al guardar datos en RDS.', 
        error: error.message 
      } as ErrorResponse) 
    };
  }
};

export const appointmentCl = async (event: any) => {
  try {
    // Se puede agregar logica personalizada para clientes CHILE
    await processAppointmentRecords(event);
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Datos guardados en RDS correctamente.' } as AppointmentResponse) 
    };
  } catch (error: any) {
    console.error('Error processing message:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Error storing data in RDS.', error: error.message } as ErrorResponse) 
    };
  }
};

async function processAppointmentRecords(event: any) {
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
    
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [
        {
          Source: "appointments.service",  // Puedes inventar uno
          DetailType: "AppointmentCompleted",
          Detail: JSON.stringify({
            appointmentId,
          }),
          EventBusName: "default", // O puedes crear un bus custom si quieres
        }
      ]
    }));

    await dynamoRepo.updateAppointmentStatus(appointmentId, 'completed');

    console.log('Datos insertados en RDS:', result);
  }
}