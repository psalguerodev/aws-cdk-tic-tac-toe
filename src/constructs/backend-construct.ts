import {
  aws_apigateway as apigateway,
  aws_dynamodb as dynamodb,
  aws_lambda_nodejs as lambdaNodejs,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

export interface BackendConstructProps {
  tableName: string;
  linksTableName: string;
}

export class BackendConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly apiUrl: string;
  public readonly table: dynamodb.Table;
  public readonly linksTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: BackendConstructProps) {
    super(scope, id);

    // Crear la tabla DynamoDB para juegos
    this.table = new dynamodb.Table(this, "GamesTable", {
      tableName: props.tableName,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: "ttl",
    });

    // Crear la tabla DynamoDB para enlaces
    this.linksTable = new dynamodb.Table(this, "LinksTable", {
      tableName: `${props.linksTableName}-v2`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: "ttl",
    });

    // Crear las funciones Lambda para juegos
    const saveGameFunction = new lambdaNodejs.NodejsFunction(
      this,
      "SaveGameFunction",
      {
        entry: path.join(
          __dirname,
          "../../backend/src/functions/saveGame/index.ts"
        ),
        handler: "handler",
        environment: {
          TABLE_NAME: this.table.tableName,
        },
      }
    );

    const getStatsFunction = new lambdaNodejs.NodejsFunction(
      this,
      "GetStatsFunction",
      {
        entry: path.join(
          __dirname,
          "../../backend/src/functions/getStats/index.ts"
        ),
        handler: "handler",
        environment: {
          TABLE_NAME: this.table.tableName,
        },
      }
    );

    // Crear las funciones Lambda para enlaces
    const saveLinksFunction = new lambdaNodejs.NodejsFunction(
      this,
      "SaveLinksFunction",
      {
        entry: path.join(
          __dirname,
          "../../backend/src/functions/saveLinks/index.ts"
        ),
        handler: "handler",
        environment: {
          LINKS_TABLE_NAME: this.linksTable.tableName,
        },
      }
    );

    const getLinksFunction = new lambdaNodejs.NodejsFunction(
      this,
      "GetLinksFunction",
      {
        entry: path.join(
          __dirname,
          "../../backend/src/functions/getLinks/index.ts"
        ),
        handler: "handler",
        environment: {
          LINKS_TABLE_NAME: this.linksTable.tableName,
        },
      }
    );

    // Nuevas funciones Lambda para editar y eliminar enlaces
    const editLinksFunction = new lambdaNodejs.NodejsFunction(
      this,
      "EditLinksFunction",
      {
        entry: path.join(
          __dirname,
          "../../backend/src/functions/editLinks/index.ts"
        ),
        handler: "handler",
        environment: {
          LINKS_TABLE_NAME: this.linksTable.tableName,
        },
      }
    );

    const deleteLinksFunction = new lambdaNodejs.NodejsFunction(
      this,
      "DeleteLinksFunction",
      {
        entry: path.join(
          __dirname,
          "../../backend/src/functions/deleteLinks/index.ts"
        ),
        handler: "handler",
        environment: {
          LINKS_TABLE_NAME: this.linksTable.tableName,
        },
      }
    );

    // Dar permisos a las funciones Lambda para acceder a DynamoDB
    this.table.grantWriteData(saveGameFunction);
    this.table.grantReadData(getStatsFunction);
    this.linksTable.grantWriteData(saveLinksFunction);
    this.linksTable.grantReadData(getLinksFunction);
    this.linksTable.grantWriteData(editLinksFunction);
    this.linksTable.grantReadData(editLinksFunction);
    this.linksTable.grantWriteData(deleteLinksFunction);
    this.linksTable.grantReadData(deleteLinksFunction);

    // Crear API Gateway
    this.api = new apigateway.RestApi(this, "GameApi", {
      restApiName: "Game Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Crear recursos y métodos en API Gateway para juegos
    const games = this.api.root.addResource("games");
    games.addMethod("POST", new apigateway.LambdaIntegration(saveGameFunction));

    const stats = this.api.root.addResource("stats");
    stats.addMethod("GET", new apigateway.LambdaIntegration(getStatsFunction));

    // Crear recursos y métodos en API Gateway para enlaces
    const links = this.api.root.addResource("links");
    links.addMethod("GET", new apigateway.LambdaIntegration(getLinksFunction));
    links.addMethod(
      "POST",
      new apigateway.LambdaIntegration(saveLinksFunction)
    );

    // Agregar recursos y métodos para editar y eliminar enlaces
    const linkId = links.addResource("{id}");
    linkId.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(editLinksFunction)
    );
    linkId.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteLinksFunction)
    );

    // Guardar la URL de la API
    this.apiUrl = this.api.url;
  }
}
