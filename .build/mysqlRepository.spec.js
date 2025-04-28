"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// mysqlRepository.test.ts
const mysqlRepository_1 = __importDefault(require("./mysqlRepository"));
// Mock completo y detallado para mysql2
jest.mock('mysql2', () => {
    // Creamos un objeto mock para la conexión
    const executeMock = jest.fn();
    const promiseMock = jest.fn().mockReturnValue({
        execute: executeMock
    });
    const endMock = jest.fn().mockResolvedValue(undefined);
    // El mock de createConnection devuelve un objeto con los métodos necesarios
    return {
        createConnection: jest.fn().mockReturnValue({
            promise: promiseMock,
            end: endMock
        })
    };
});
describe('MySqlRepository', () => {
    let mySqlRepo;
    const dbConfig = {
        host: 'localhost',
        user: 'test',
        password: 'password',
        database: 'testdb'
    };
    // Obtenemos referencia a los mocks
    const mysql = require('mysql2');
    const createConnectionMock = mysql.createConnection;
    beforeEach(() => {
        // Limpiamos todos los mocks antes de cada prueba
        jest.clearAllMocks();
        mySqlRepo = new mysqlRepository_1.default(dbConfig);
    });
    describe('getAppointmentsByCountry', () => {
        it('should fetch appointments by country successfully', async () => {
            // Datos de prueba
            const countryISO = 'PE';
            const mockRows = [
                { appointment_id: '123', insured_id: '456', schedule_id: 1, country_iso: 'PE', status: 'pending' }
            ];
            // Configurar el mock para execute
            const executeMock = createConnectionMock().promise().execute;
            executeMock.mockResolvedValueOnce([mockRows, []]);
            // Ejecutar el método
            const result = await mySqlRepo.getAppointmentsByCountry(countryISO);
            // Verificar que se llamó correctamente
            expect(createConnectionMock).toHaveBeenCalledWith(dbConfig);
            expect(executeMock).toHaveBeenCalledWith('SELECT * FROM appointments WHERE country_iso = ?', [countryISO]);
            expect(result).toEqual(mockRows);
            expect(createConnectionMock().end).toHaveBeenCalled();
        });
        it('should handle database error when fetching appointments', async () => {
            // Configurar el mock para lanzar un error
            const executeMock = createConnectionMock().promise().execute;
            executeMock.mockRejectedValueOnce(new Error('Database error'));
            // Ejecutar y verificar que lanza el error esperado
            await expect(mySqlRepo.getAppointmentsByCountry('PE')).rejects.toThrow('Database error');
            // Verificar que se cierra la conexión incluso si hay error
            expect(createConnectionMock().end).toHaveBeenCalled();
        });
    });
    describe('saveAppointment', () => {
        it('should save an appointment successfully', async () => {
            // Datos de prueba
            const appointmentId = '123';
            const insuredId = '456';
            const scheduleId = '1';
            const countryISO = 'PE';
            const status = 'pending';
            const mockResult = { affectedRows: 1, insertId: 1 };
            // Configurar el mock para execute
            const executeMock = createConnectionMock().promise().execute;
            executeMock.mockResolvedValueOnce([mockResult, undefined]);
            // Ejecutar el método
            const result = await mySqlRepo.saveAppointment(appointmentId, insuredId, scheduleId, countryISO, status);
            // Verificar que se llamó correctamente
            expect(createConnectionMock).toHaveBeenCalledWith(dbConfig);
            expect(executeMock).toHaveBeenCalledWith('INSERT INTO appointments (appointment_id, insured_id, schedule_id, country_iso, status) VALUES (?, ?, ?, ?, ?)', [
                String(appointmentId),
                String(insuredId),
                Number(scheduleId),
                String(countryISO),
                status
            ]);
            expect(result).toEqual(mockResult);
            expect(createConnectionMock().end).toHaveBeenCalled();
        });
        it('should handle database error when saving an appointment', async () => {
            // Configurar el mock para lanzar un error
            const executeMock = createConnectionMock().promise().execute;
            executeMock.mockRejectedValueOnce(new Error('Database error'));
            // Ejecutar y verificar que lanza el error esperado
            await expect(mySqlRepo.saveAppointment('123', '456', '1', 'PE', 'pending')).rejects.toThrow('Database error');
            // Verificar que se cierra la conexión incluso si hay error
            expect(createConnectionMock().end).toHaveBeenCalled();
        });
    });
});
