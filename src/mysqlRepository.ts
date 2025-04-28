const mysql = require('mysql2');

class MySqlRepository {
  private dbConfig:any;
  constructor(dbConfig:any) {
    this.dbConfig = dbConfig;
  }

  async getAppointmentsByCountry(countryISO:string) {
    const connection = mysql.createConnection(this.dbConfig);
    try {
      const query = 'SELECT * FROM appointments WHERE country_iso = ?';
      const params = [countryISO];
      
      const [rows, fields] = await connection.promise().execute(query, params);
      return rows;
    } finally {
      await connection.end();
    }
  }


  async saveAppointment(appointmentId:string, insuredId:string, scheduleId:string, countryISO:string, status:string) {
    const connection = mysql.createConnection(this.dbConfig);
    try {
      const query = 'INSERT INTO appointments (appointment_id, insured_id, schedule_id, country_iso, status) VALUES (?, ?, ?, ?, ?)';
      const params = [
        String(appointmentId),
        String(insuredId),
        Number(scheduleId),
        String(countryISO),
        status
      ];
      
      const [rows] = await connection.promise().execute(query, params);
      return rows;
    } finally {
      await connection.end();
    }
  }
}

export default MySqlRepository;