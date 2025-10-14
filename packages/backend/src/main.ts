import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('API Mutation Tester')
    .setDescription(`
      API Mutation Tester is a comprehensive tool for testing API robustness through automated mutations.
      
      ## Features
      - Execute happy path tests to validate API functionality
      - Generate and execute mutations to test API resilience
      - Detect vulnerabilities and integrity issues
      - Generate detailed reports with statistics and analysis
      - Export results in JSON format
      
      ## Workflow
      1. **Create Test**: Submit API configuration (URL, method, headers, payload)
      2. **Monitor Progress**: Track test execution status and progress
      3. **View Results**: Access detailed test results and analysis
      4. **Export Report**: Download comprehensive reports in JSON format
      
      ## Test Phases
      - **Validation**: Validate test configuration
      - **Happy Path**: Execute original request to ensure it works
      - **Mutations**: Execute various mutations to test robustness
      - **Report**: Generate comprehensive analysis and statistics
    `)
    .setVersion('1.0.0')
    .setContact(
      'API Mutation Tester Team',
      'https://github.com/api-mutation-tester',
      'support@api-mutation-tester.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('tests', 'Test execution and management endpoints')
    .addServer('http://localhost:3001', 'Development server')
    .addServer('https://api.mutation-tester.com', 'Production server')
    .build();
    
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API Mutation Tester - API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1976d2 }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });
  
  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();