"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// NotificationService.test.ts
const notificationService_1 = __importDefault(require("./notificationService"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
describe('NotificationService', () => {
    let notificationService;
    const mockPublish = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
        notificationService = new notificationService_1.default();
        // Remockear aws-sdk dentro del beforeEach para asegurar que mockPublish esté definido
        jest.mock('aws-sdk', () => {
            return {
                SNS: jest.fn(() => ({
                    publish: mockPublish,
                })),
            };
        });
    });
    describe('publishToSNS', () => {
        it('should publish a message to the specified SNS topic with correct parameters', async () => {
            // Configurar
            const topicArn = 'arn:aws:sns:us-east-1:123456789012:my-topic';
            const message = {
                appointmentId: 'appt-123',
                insuredId: 'insured-123',
                scheduleId: 'schedule-123',
                countryISO: 'PE',
            };
            const messageAttributes = {
                countryISO: {
                    DataType: 'String',
                    StringValue: 'PE',
                },
            };
            // Ejecutar
            await notificationService.publishToSNS(topicArn, message, messageAttributes);
            // Verificar
            const mockedSNS = aws_sdk_1.default.SNS;
            const publishMockInstance = mockedSNS.mock.instances[0];
            expect(publishMockInstance.publish).toHaveBeenCalledTimes(1);
            expect(publishMockInstance.publish).toHaveBeenCalledWith({
                TopicArn: topicArn,
                Message: JSON.stringify(message),
                MessageAttributes: messageAttributes,
            });
        });
    });
});
