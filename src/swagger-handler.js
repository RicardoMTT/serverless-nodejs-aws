// src/swagger-handler.js

// src/swagger-handler.js
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    // Ruta al archivo JSON generado por el plugin
    const swaggerJsonPath = path.resolve(process.env.LAMBDA_TASK_ROOT, 'swagger.json');
    
    // Para solicitud del archivo JSON de Swagger
    if (event.path.endsWith('swagger.json')) {
      let swaggerJson;
      
      try {
        if (fs.existsSync(swaggerJsonPath)) {
          swaggerJson = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));
        } else {
          // Si no encontramos el archivo en la ubicación esperada, usamos un objeto vacío
          console.log('Archivo swagger.json no encontrado en:', swaggerJsonPath);
          swaggerJson = { 
            swagger: "2.0",
            info: { 
              title: "API de Citas Médicas",
              version: "1.0.0"
            },
            paths: {}
          };
        }
      } catch (error) {
        console.error('Error al leer swagger.json:', error);
        swaggerJson = { error: 'Error al cargar la configuración de Swagger' };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(swaggerJson)
      };
    }
    
    // Para la interfaz de Swagger UI
    const baseUrl = process.env.IS_OFFLINE 
      ? 'http://localhost:3000' 
      : `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
      
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>API de Citas Médicas - Documentación</title>
      <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.css">
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: "${baseUrl}/swagger.json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis
            ],
            layout: "BaseLayout"
          });
        }
      </script>
    </body>
    </html>
    `;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
      },
      body: html
    };
  } catch (error) {
    console.error('Error al servir Swagger:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al servir la documentación Swagger', details: error.message })
    };
  }
};