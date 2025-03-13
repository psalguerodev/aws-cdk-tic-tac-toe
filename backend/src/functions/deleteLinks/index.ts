import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDB = new DynamoDB.DocumentClient();
const LINKS_TABLE_NAME = process.env.LINKS_TABLE_NAME || "";

interface Link {
  id: string;
  name: string;
  url: string;
  createdAt: number;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  // Configurar CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  };

  try {
    // Verificar método HTTP
    if (event.httpMethod !== "DELETE") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: "Método no permitido" }),
      };
    }

    // Obtener el ID del enlace de los parámetros de la ruta
    const linkId = event.pathParameters?.id;
    if (!linkId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "ID del enlace no proporcionado" }),
      };
    }

    // Verificar si el enlace existe
    const getResult = await dynamoDB
      .get({
        TableName: LINKS_TABLE_NAME,
        Key: {
          id: linkId,
        },
      })
      .promise();

    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Enlace no encontrado" }),
      };
    }

    // Eliminar el enlace de DynamoDB
    await dynamoDB
      .delete({
        TableName: LINKS_TABLE_NAME,
        Key: {
          id: linkId,
        },
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Enlace eliminado correctamente" }),
    };
  } catch (error) {
    console.error("Error al eliminar el enlace:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error al eliminar el enlace",
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    };
  }
};
