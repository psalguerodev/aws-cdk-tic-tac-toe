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
    if (event.httpMethod !== "PUT") {
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

    // Parsear el cuerpo de la solicitud
    const body = JSON.parse(event.body || "{}");
    const { url } = body;

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "URL no proporcionada" }),
      };
    }

    // Validar formato de URL
    try {
      new URL(url);
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "URL inválida" }),
      };
    }

    // Obtener el enlace actual
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

    const currentLink = getResult.Item as Link;

    // Preparar el enlace actualizado
    const updatedLink: Link = {
      ...currentLink,
      url: url.trim(),
      name: new URL(url).hostname.replace("www.", ""),
    };

    // Actualizar el enlace en DynamoDB
    await dynamoDB
      .update({
        TableName: LINKS_TABLE_NAME,
        Key: {
          id: linkId,
        },
        UpdateExpression: "set #url = :url, #name = :name",
        ExpressionAttributeNames: {
          "#url": "url",
          "#name": "name",
        },
        ExpressionAttributeValues: {
          ":url": updatedLink.url,
          ":name": updatedLink.name,
        },
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedLink),
    };
  } catch (error) {
    console.error("Error al editar el enlace:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error al editar el enlace",
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    };
  }
};
