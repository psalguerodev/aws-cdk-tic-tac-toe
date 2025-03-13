import { App, Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BackendConstruct } from "./constructs/backend-construct";
import { WebsiteConstruct } from "./constructs/website-construct";

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // Crear el backend con API Gateway, Lambda y DynamoDB
    const backend = new BackendConstruct(this, "BackendConstruct", {
      tableName: `${id}-games-table`,
      linksTableName: `${id}-links-table`,
    });

    // Crear el sitio web con S3 y CloudFront
    const website = new WebsiteConstruct(this, "WebsiteConstruct", {
      bucketName: `${id}-website-bucket`,
      websitePath: "../../frontend/dist",
    });

    // Outputs a nivel de stack
    new CfnOutput(this, "WebsiteURLStack", {
      value: website.websiteUrl,
      description: "URL del sitio web (Stack)",
    });

    new CfnOutput(this, "CloudFrontURLStack", {
      value: `https://${website.distribution.distributionDomainName}`,
      description: "URL de CloudFront del sitio web",
    });

    new CfnOutput(this, "BucketNameStack", {
      value: website.bucketName,
      description: "Nombre del bucket S3 (Stack)",
    });

    new CfnOutput(this, "ApiUrlStack", {
      value: backend.apiUrl,
      description: "URL de la API Gateway",
    });

    new CfnOutput(this, "GamesTableNameStack", {
      value: backend.table.tableName,
      description: "Nombre de la tabla DynamoDB de juegos",
    });

    new CfnOutput(this, "LinksTableNameStack", {
      value: backend.linksTable.tableName,
      description: "Nombre de la tabla DynamoDB de enlaces",
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, "cdk-projen-io-ts-dev", { env: devEnv });
// new MyStack(app, 'cdk-projen-io-ts-prod', { env: prodEnv });

app.synth();
