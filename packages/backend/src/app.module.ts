import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestsController } from './controllers/tests.controller';
import { HttpClientService } from './services/http-client.service';
import { MetricsService } from './services/metrics.service';
import { MutationGeneratorService } from './services/mutation-generator.service';
import { VulnerabilityDetectorService } from './services/vulnerability-detector.service';
import { TestExecutionService } from './services/test-execution.service';
import { ReportGeneratorService } from './services/report-generator.service';


@Module({
  imports: [],
  controllers: [AppController, TestsController],
  providers: [
    AppService, 
    HttpClientService, 
    MetricsService, 
    MutationGeneratorService, 
    VulnerabilityDetectorService, 
    TestExecutionService, 
    ReportGeneratorService,

  ],
})
export class AppModule {}