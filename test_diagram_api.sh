#!/bin/bash
echo "Iniciando servidor..." > test_results.log
cd /home/bquiroga/Documents/dev/sw1/examen/joint-js
npx tsx server/index.ts >> server_output.log 2>&1 &
SERVER_PID=$!
echo "Servidor iniciado con PID: $SERVER_PID" >> test_results.log
sleep 3

echo "Creando diagrama de prueba..." >> test_results.log
CREATE_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/diagrams" -H "Content-Type: application/json" -d '{"diagramId":"test-123","name":"Test","creatorId":"test","state":"{}"}')
echo "Respuesta creación: $CREATE_RESPONSE" >> test_results.log

echo "Obteniendo diagramas del usuario..." >> test_results.log
GET_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/diagrams/user/test")
echo "Diagramas encontrados: $GET_RESPONSE" >> test_results.log

echo "Eliminando diagrama..." >> test_results.log
DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:3001/api/diagrams/test-123")
echo "Respuesta eliminación: $DELETE_RESPONSE" >> test_results.log

echo "Verificando eliminación..." >> test_results.log
FINAL_CHECK=$(curl -s -X GET "http://localhost:3001/api/diagrams/user/test")
echo "Diagramas después de eliminación: $FINAL_CHECK" >> test_results.log

echo "Deteniendo servidor..." >> test_results.log
kill $SERVER_PID 2>/dev/null || true
echo "Prueba completada." >> test_results.log