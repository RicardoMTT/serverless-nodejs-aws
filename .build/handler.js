"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentCl = exports.appointmentPe = exports.appointment = exports.getAppointments = void 0;
// Importar dependencias
const mysqlRepository_1 = __importDefault(require("./mysqlRepository"));
const notificationService_1 = __importDefault(require("./notificationService"));
const dynamoRepository_1 = __importDefault(require("./dynamoRepository"));
const client_eventbridge_1 = require("@aws-sdk/client-eventbridge");
const eventBridgeClient = new client_eventbridge_1.EventBridgeClient({ region: "us-east-1" });
// Crear una conexión a RDS
const dbConfig = {
    host: 'test.crbwbjdd2jat.us-east-1.rds.amazonaws.com',
    user: 'root',
    password: 'Indiegente003',
    database: 'test'
};
// Inicializar repositorios y servicios
const dynamoRepo = new dynamoRepository_1.default('appointments');
const mysqlRepo = new mysqlRepository_1.default(dbConfig);
const notificationService = new notificationService_1.default();
/**
 * @swagger
 * /appointments/{countryISO}:
 *   get:
 *     summary: Get appointments by country
 *     description: Retrieves all appointments for a specific country (PE or CL)
 *     parameters:
 *       - in: path
 *         name: countryISO
 *         required: true
 *         description: ISO code of the country (PE or CL)
 *         schema:
 *           type: string
 *           enum: [PE, CL]
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid country ISO
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const getAppointments = async (event) => {
    try {
        const { countryISO } = event.pathParameters;
        if (countryISO !== 'PE' && countryISO !== 'CL') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid countryISO. Must be "PE" or "CL".' }),
            };
        }
        const appointments = await mysqlRepo.getAppointmentsByCountry(countryISO);
        return {
            statusCode: 200,
            body: JSON.stringify(appointments),
        };
    }
    catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred while fetching appointments.' }),
        };
    }
};
exports.getAppointments = getAppointments;
/**
 * @swagger
 * /appointment:
 *   post:
 *     summary: Create a new appointment
 *     description: Creates a new appointment and notifies via SNS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentRequest'
 *     responses:
 *       200:
 *         description: Appointment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "La cita esta siendo procesada."
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const appointment = async (event) => {
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
        // Se guarda la cita en DynamoDB
        await dynamoRepo.saveAppointment(appointmentData);
        // Determinar cual topic sns enviar basado en el campo countryISO
        let snsTopicArn = process.env.SNS_TOPIC_PE || '';
        if (countryISO === 'PE') {
            snsTopicArn = process.env.SNS_TOPIC_PE || '';
        }
        else if (countryISO === 'CL') {
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
            body: JSON.stringify({ message: 'La cita esta siendo procesada.' }),
        };
    }
    catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Un error ocurrio mientras se proceso la cita.' }),
        };
    }
};
exports.appointment = appointment;
/**
 * @swagger
 * /appointments/process/pe:
 *   post:
 *     summary: Process Peru appointments from SQS
 *     description: Internal endpoint to process appointments for Peru
 *     responses:
 *       200:
 *         description: Appointments processed successfully
 *       500:
 *         description: Server error
 */
const appointmentPe = async (event) => {
    try {
        // Se puede agregar logica personalizada para clientes PERU
        await processAppointmentRecords(event);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Datos guardados en RDS correctamente.' })
        };
    }
    catch (error) {
        console.error('Error al procesar el mensaje:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error al guardar datos en RDS.',
                error: error.message
            })
        };
    }
};
exports.appointmentPe = appointmentPe;
/**
 * @swagger
 * /appointments/process/cl:
 *   post:
 *     summary: Process Chile appointments from SQS
 *     description: Internal endpoint to process appointments for Chile
 *     responses:
 *       200:
 *         description: Appointments processed successfully
 *       500:
 *         description: Server error
 */
const appointmentCl = async (event) => {
    try {
        // Se puede agregar logica personalizada para clientes CHILE
        await processAppointmentRecords(event);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Datos guardados en RDS correctamente.' })
        };
    }
    catch (error) {
        console.error('Error processing message:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error storing data in RDS.', error: error.message })
        };
    }
};
exports.appointmentCl = appointmentCl;
async function processAppointmentRecords(event) {
    for (const record of event.Records) {
        const body = JSON.parse(record.body);
        let messageData;
        if (body.Message) {
            messageData = JSON.parse(body.Message);
        }
        else {
            messageData = body;
        }
        const { appointmentId, insuredId, scheduleId, countryISO } = messageData;
        if (!appointmentId || !insuredId || !scheduleId || !countryISO) {
            throw new Error(`Datos incompletos: ${JSON.stringify(messageData)}`);
        }
        const result = await mysqlRepo.saveAppointment(appointmentId, insuredId, scheduleId, countryISO, 'pending');
        await eventBridgeClient.send(new client_eventbridge_1.PutEventsCommand({
            Entries: [
                {
                    Source: "appointments.service", // Puedes inventar uno
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
