import * as path from 'path';
import {
  aws_apigateway as apigateway,
  aws_dynamodb as dynamodb,
  aws_lambda_nodejs as lambdaNodejs,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface BackendConstructProps {
  tableName: string;
}

export class BackendConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly apiUrl: string;
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: BackendConstructProps) {
    super(scope, id);

    // Crear la tabla DynamoDB
    this.table = new dynamodb.Table(this, 'GamesTable', {
      tableName: props.tableName,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY, // Solo para desarrollo
      timeToLiveAttribute: 'ttl',
    });

    // Crear las funciones Lambda
    const saveGameFunction = new lambdaNodejs.NodejsFunction(
      this,
      'SaveGameFunction',
      {
        entry: path.join(
          __dirname,
          '../../backend/src/functions/saveGame/index.ts',
        ),
        handler: 'handler',
        environment: {
          TABLE_NAME: this.table.tableName,
        },
      },
    );

    const getStatsFunction = new lambdaNodejs.NodejsFunction(
      this,
      'GetStatsFunction',
      {
        entry: path.join(
          __dirname,
          '../../backend/src/functions/getStats/index.ts',
        ),
        handler: 'handler',
        environment: {
          TABLE_NAME: this.table.tableName,
        },
      },
    );

    // Dar permisos a las funciones Lambda para acceder a DynamoDB
    this.table.grantWriteData(saveGameFunction);
    this.table.grantReadData(getStatsFunction);

    // Crear API Gateway
    this.api = new apigateway.RestApi(this, 'GameApi', {
      restApiName: 'Game Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Crear recursos y métodos en API Gateway
    const games = this.api.root.addResource('games');
    games.addMethod('POST', new apigateway.LambdaIntegration(saveGameFunction));

    const stats = this.api.root.addResource('stats');
    stats.addMethod('GET', new apigateway.LambdaIntegration(getStatsFunction));

    // Guardar la URL de la API
    this.apiUrl = this.api.url;
  }
}
