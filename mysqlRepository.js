const mysql = require('mysql2');

class MySqlRepository {
  constructor(dbConfig) {
    this.dbConfig = dbConfig;
  }

  async saveAppointment(appointmentId, insuredId, scheduleId, countryISO, status) {
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
      
      const [rows, fields] = await connection.promise().execute(query, params);
      return rows;
    } finally {
      await connection.end();
    }
  }
}

module.exports = MySqlRepository;