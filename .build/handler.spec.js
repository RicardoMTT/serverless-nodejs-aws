"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importamos el handler y la clase MySqlRepository
const handler_1 = require("./handler");
const mysqlRepository_1 = __importDefault(require("./mysqlRepository"));
// Mockeamos MySqlRepository
jest.mock('./mysqlRepository');
describe('getAppointments', () => {
    let mockGetAppointmentsByCountry;
    // Guardamos la función original de console.error
    const originalConsoleError = console.error;
    beforeEach(() => {
        // Configuramos el mock de la clase MySqlRepository antes de cada prueba
        mockGetAppointmentsByCountry = mysqlRepository_1.default.prototype.getAppointmentsByCountry;
        jest.clearAllMocks(); // Limpiamos los mocks antes de cada prueba
        // Restauramos console.error a su implementación original antes de cada prueba
        console.error = originalConsoleError;
    });
    afterAll(() => {
        // Aseguramos que console.error vuelva a su implementación original después de todas las pruebas
        console.error = originalConsoleError;
    });
    it('debería retornar 400 si countryISO es inválido', async () => {
        const event = {
            pathParameters: { countryISO: 'US' },
        };
        const response = await (0, handler_1.getAppointments)(event);
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({
            message: 'Invalid countryISO. Must be "PE" or "CL".',
        });
    });
    it('debería retornar 200 con las citas si countryISO es PE', async () => {
        const mockAppointments = [{ id: 1, name: 'Cita 1' }];
        // Mockeamos el método getAppointmentsByCountry para devolver mockAppointments
        mockGetAppointmentsByCountry.mockResolvedValue(mockAppointments);
        const event = {
            pathParameters: { countryISO: 'PE' },
        };
        const response = await (0, handler_1.getAppointments)(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual(mockAppointments);
    });
    it('debería retornar 500 si ocurre un error', async () => {
        // Silenciamos temporalmente console.error para este test
        console.error = jest.fn();
        // Mockeamos el método getAppointmentsByCountry para rechazar la promesa
        mockGetAppointmentsByCountry.mockRejectedValue(new Error('DB error'));
        const event = {
            pathParameters: { countryISO: 'PE' },
        };
        const response = await (0, handler_1.getAppointments)(event);
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body)).toEqual({
            message: 'An error occurred while fetching appointments.',
        });
        // Opcional: verificar que se llamó a console.error
        expect(console.error).toHaveBeenCalled();
    });
});
