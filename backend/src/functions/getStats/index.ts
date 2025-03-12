import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { GameResult, GameStats } from "../../types";

const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Limit: 100, // Limitamos a los últimos 100 juegos
    };

    const result = await dynamodb.scan(params).promise();
    const games = result.Items as GameResult[];

    // Procesar estadísticas
    const playerStats: { [key: string]: { name: string; wins: number } } = {};
    games.forEach((game) => {
      // Actualizar estadísticas del jugador X
      if (!playerStats[game.playerX.name]) {
        playerStats[game.playerX.name] = { name: game.playerX.name, wins: 0 };
      }
      if (game.winner === "X") {
        playerStats[game.playerX.name].wins++;
      }

      // Actualizar estadísticas del jugador O
      if (!playerStats[game.playerO.name]) {
        playerStats[game.playerO.name] = { name: game.playerO.name, wins: 0 };
      }
      if (game.winner === "O") {
        playerStats[game.playerO.name].wins++;
      }
    });

    const stats: GameStats = {
      games,
      totalGames: games.length,
      playerStats,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error al obtener las estadísticas",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
