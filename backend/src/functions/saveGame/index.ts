import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { GameResult } from "../../types";

const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "No se proporcionaron datos del juego",
        }),
      };
    }

    const gameResult: GameResult = JSON.parse(event.body);
    const timestamp = new Date().toISOString();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: `game_${timestamp}`,
        ...gameResult,
        date: timestamp,
      },
    };

    await dynamodb.put(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Juego guardado exitosamente",
        gameId: `game_${timestamp}`,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error al guardar el juego",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
