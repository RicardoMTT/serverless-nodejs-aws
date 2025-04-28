"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// dynamoRepository.test.ts
const dynamoRepository_1 = __importDefault(require("./dynamoRepository"));
// Mock para AWS-SDK
jest.mock('aws-sdk', () => {
    const mockPromise = jest.fn();
    const mockPut = jest.fn().mockReturnValue({ promise: mockPromise });
    const mockUpdate = jest.fn().mockReturnValue({ promise: mockPromise });
    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => ({
                put: mockPut,
                update: mockUpdate,
                promise: mockPromise
            }))
        }
    };
});
describe('DynamoRepository', () => {
    let dynamoRepo;
    const tableName = 'appointments';
    const mockDynamoDB = require('aws-sdk').DynamoDB;
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
        dynamoRepo = new dynamoRepository_1.default(tableName);
    });
    describe('saveAppointment', () => {
        it('should save an appointment successfully', async () => {
            // Configurar
            const appointmentData = { appointmentId: '123', insuredId: '456', status: 'pending' };
            const mockPut = mockDynamoDB.DocumentClient().put;
            mockPut().promise.mockResolvedValue({});
            // Ejecutar
            await dynamoRepo.saveAppointment(appointmentData);
            // Verificar
            expect(mockPut).toHaveBeenCalledWith({
                TableName: tableName,
                Item: appointmentData
            });
        });
        it('should throw an error if saving an appointment fails', async () => {
            // Configurar
            const appointmentData = { appointmentId: '123', insuredId: '456', status: 'pending' };
            const mockPut = mockDynamoDB.DocumentClient().put;
            mockPut().promise.mockRejectedValue(new Error('Database error'));
            // Ejecutar y verificar
            await expect(dynamoRepo.saveAppointment(appointmentData)).rejects.toThrow('Database error');
        });
    });
    describe('updateAppointmentStatus', () => {
        it('should update appointment status successfully', async () => {
            // Configurar
            const appointmentId = '123';
            const status = 'completed';
            const mockUpdate = mockDynamoDB.DocumentClient().update;
            mockUpdate().promise.mockResolvedValue({});
            // Ejecutar
            await dynamoRepo.updateAppointmentStatus(appointmentId, status);
            // Verificar
            expect(mockUpdate).toHaveBeenCalledWith({
                TableName: tableName,
                Key: { appointmentId },
                UpdateExpression: 'set #s = :s',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: { ':s': status }
            });
        });
        it('should throw an error if updating appointment status fails', async () => {
            // Configurar
            const appointmentId = '123';
            const status = 'completed';
            const mockUpdate = mockDynamoDB.DocumentClient().update;
            mockUpdate().promise.mockRejectedValue(new Error('Update failed'));
            // Ejecutar y verificar
            await expect(dynamoRepo.updateAppointmentStatus(appointmentId, status)).rejects.toThrow('Update failed');
        });
    });
});
