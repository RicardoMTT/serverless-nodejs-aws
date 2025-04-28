# 📋 Appointments Serverless API

Este proyecto es una **aplicación Serverless** para el manejo de citas médicas (appointments) utilizando **AWS Lambda**, **DynamoDB**, **RDS MySQL** y **SNS**.

## 🚀 Descripción

La aplicación permite:

- Crear citas y almacenarlas inicialmente en **DynamoDB**.
- Notificar a través de **SNS** para posterior procesamiento.
- Procesar citas recibidas y almacenarlas de forma permanente en **RDS (MySQL)**.
- Consultar citas por país (**Perú** o **Chile**).

Está diseñado para trabajar de forma asíncrona y escalable, utilizando eventos de **SNS** y colas de **SQS** para desacoplar el flujo de procesamiento.

## 🛠️ Tecnologías Utilizadas

- **Node.js** (TypeScript)
- **AWS Lambda**
- **AWS DynamoDB**
- **AWS RDS (MySQL)**
- **AWS SNS**
- **AWS SQS**
- **Serverless Framework**

## 📚 Estructura del Código

### 1. **Handler.ts**

Contiene las funciones principales de Lambda:

- `getAppointments`  
  Obtiene citas de la base de datos MySQL según el país (`PE` o `CL`).

- `appointment`  
  Recibe datos de una nueva cita, los guarda en **DynamoDB** y publica un mensaje en **SNS** para su procesamiento.

- `appointmentPe`  
  Procesa citas provenientes de mensajes **SQS** específicos para **Perú**.

- `appointmentCl`  
  Procesa citas provenientes de mensajes **SQS** específicos para **Chile**.

- `processAppointmentRecords`  
  Función interna que guarda la cita en **RDS** y actualiza su estado en **DynamoDB** a `completed`.

---

### 2. **DynamoRepository.ts**

Clase para interactuar con **DynamoDB**:

- `saveAppointment(appointmentData)`  
  Guarda un nuevo registro de cita.

- `updateAppointmentStatus(appointmentId, status)`  
  Actualiza el estado de una cita existente.

---

### 3. **MySqlRepository.ts**

Clase para interactuar con **MySQL**:

- `getAppointmentsByCountry(countryISO)`  
  Consulta las citas almacenadas según el país.

- `saveAppointment(appointmentId, insuredId, scheduleId, countryISO, status)`  
  Inserta una nueva cita en la tabla **appointments**.

---

### 4. **NotificationService.ts**

Módulo para publicar mensajes a **SNS** con los atributos necesarios para su procesamiento.

---

## 🧪 Endpoints principales (Swagger anotaciones)

- **GET** `/appointments/{countryISO}`  
  Obtener citas por país (`PE` o `CL`).

- **POST** `/appointments`  
  Crear una nueva cita (se almacena en Dynamo y se envía mensaje a SNS).

- **POST** `/appointments/process/pe`  
  Procesar citas de Perú desde mensajes SQS.

- **POST** `/appointments/process/cl`  
  Procesar citas de Chile desde mensajes SQS.

## Arquitectura

![image](https://github.com/user-attachments/assets/ab4cc30a-ea08-4ef9-8358-2e71b5c8c912)


---

## ⚙️ Variables de Entorno

Debes configurar en tu entorno:

- `SNS_TOPIC_PE` → ARN del topic SNS para Perú.
- `SNS_TOPIC_CL` → ARN del topic SNS para Chile.

---

## 📦 Instalación

```bash
npm install
```

## 🧩 Despliegue

Si usas Serverless Framework:

```bash
sls deploy
```

### Endpoints

Para crear una cita

```
https://l0dktcm6q9.execute-api.us-east-1.amazonaws.com/dev/appointment
```

Para obtener las citas por pais

```
https://sjpelrzrzc.execute-api.us-east-1.amazonaws.com/appointments/PE
```

---

## 📄 Notas

- **DynamoDB** actúa como almacenamiento rápido inicial.
- **RDS MySQL** actúa como almacenamiento persistente final.
- El sistema es **extensible** para soportar otros países o flujos.

---

## 📝 Autor
  Ricardo Tovar.

