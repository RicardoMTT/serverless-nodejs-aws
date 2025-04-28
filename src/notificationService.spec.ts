// NotificationService.test.ts
import NotificationService from './notificationService';
import AWS from 'aws-sdk';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  const mockPublish = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
    notificationService = new NotificationService();

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
      const mockedSNS = AWS.SNS as jest.MockedClass<typeof AWS.SNS>;
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