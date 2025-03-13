import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDB = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.LINKS_TABLE_NAME || "Links";

interface Link {
  id: string;
  name: string;
  url: string;
  createdAt: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Verificar método HTTP
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: "Método no permitido" }),
      };
    }

    // Obtener y validar el cuerpo de la petición
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          message: "El cuerpo de la petición es requerido",
        }),
      };
    }

    const links: Link[] = JSON.parse(event.body);

    // Verificar que links sea un array
    if (!Array.isArray(links)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          message: "El formato de los enlaces es inválido",
        }),
      };
    }

    // Preparar las operaciones de escritura por lotes
    const batchWriteRequests = links.map((link) => ({
      PutRequest: {
        Item: {
          ...link,
          updatedAt: Date.now(), // Agregar timestamp de actualización
        },
      },
    }));

    // DynamoDB solo permite 25 operaciones por lote
    const batchSize = 25;
    for (let i = 0; i < batchWriteRequests.length; i += batchSize) {
      const batch = batchWriteRequests.slice(i, i + batchSize);
      await dynamoDB
        .batchWrite({
          RequestItems: {
            [TABLE_NAME]: batch,
          },
        })
        .promise();
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Enlaces guardados exitosamente",
        count: links.length,
      }),
    };
  } catch (error) {
    console.error("Error al guardar los enlaces:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Error al procesar la solicitud",
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    };
  }
};
