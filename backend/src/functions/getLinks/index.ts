import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDB = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.LINKS_TABLE_NAME || "Links";

interface Link {
  id: string;
  name: string;
  url: string;
  createdAt: number;
  updatedAt: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Verificar método HTTP
    if (event.httpMethod !== "GET") {
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

    // Parámetros para la paginación
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 50;
    const lastEvaluatedKey = event.queryStringParameters?.lastKey
      ? JSON.parse(decodeURIComponent(event.queryStringParameters.lastKey))
      : undefined;

    // Obtener todos los enlaces
    const scanParams = {
      TableName: TABLE_NAME,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
      ScanIndexForward: false, // Para orden descendente
    };

    const result = await dynamoDB.scan(scanParams).promise();

    // Ordenar los resultados por createdAt en orden descendente
    const sortedLinks = result.Items?.sort((a, b) => b.createdAt - a.createdAt);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        links: sortedLinks,
        lastEvaluatedKey: result.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
          : null,
        count: result.Count,
      }),
    };
  } catch (error) {
    console.error("Error al obtener los enlaces:", error);
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
