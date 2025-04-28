// Types for the medical appointment system

export interface AppointmentRequest {
    insuredId: string;
    scheduleId: string;
    countryISO: 'PE' | 'CL';
  }
  
  export interface Appointment {
    appointmentId: string;
    insuredId: string;
    scheduleId: string;
    countryISO: 'PE' | 'CL';
    status: 'pending' | 'completed' | 'cancelled';
  }
  
  export interface AppointmentResponse {
    message: string;
  }
  
  export interface ErrorResponse {
    message: string;
    error?: string;
  }