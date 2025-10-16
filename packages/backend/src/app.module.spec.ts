import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "./app.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TestsController } from "./controllers/tests.controller";
import { HttpClientService } from "./services/http-client.service";
import { MetricsService } from "./services/metrics.service";
import { MutationGeneratorService } from "./services/mutation-generator.service";
import { VulnerabilityDetectorService } from "./services/vulnerability-detector.service";
import { TestExecutionService } from "./services/test-execution.service";
import { ReportGeneratorService } from "./services/report-generator.service";

describe("AppModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should have AppController", () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AppController);
  });

  it("should have TestsController", () => {
    const controller = module.get<TestsController>(TestsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(TestsController);
  });

  it("should have AppService", () => {
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AppService);
  });

  it("should have HttpClientService", () => {
    const service = module.get<HttpClientService>(HttpClientService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(HttpClientService);
  });

  it("should have MetricsService", () => {
    const service = module.get<MetricsService>(MetricsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(MetricsService);
  });

  it("should have MutationGeneratorService", () => {
    const service = module.get<MutationGeneratorService>(
      MutationGeneratorService
    );
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(MutationGeneratorService);
  });

  it("should have VulnerabilityDetectorService", () => {
    const service = module.get<VulnerabilityDetectorService>(
      VulnerabilityDetectorService
    );
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(VulnerabilityDetectorService);
  });

  it("should have TestExecutionService", () => {
    const service = module.get<TestExecutionService>(TestExecutionService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(TestExecutionService);
  });

  it("should have ReportGeneratorService", () => {
    const service = module.get<ReportGeneratorService>(ReportGeneratorService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ReportGeneratorService);
  });

  it("should have all controllers registered", () => {
    const controllers = Reflect.getMetadata("controllers", AppModule);
    expect(controllers).toContain(AppController);
    expect(controllers).toContain(TestsController);
    expect(controllers).toHaveLength(2);
  });

  it("should have all providers registered", () => {
    const providers = Reflect.getMetadata("providers", AppModule);
    expect(providers).toContain(AppService);
    expect(providers).toContain(HttpClientService);
    expect(providers).toContain(MetricsService);
    expect(providers).toContain(MutationGeneratorService);
    expect(providers).toContain(VulnerabilityDetectorService);
    expect(providers).toContain(TestExecutionService);
    expect(providers).toContain(ReportGeneratorService);
    expect(providers).toHaveLength(7);
  });

  it("should have no imports", () => {
    const imports = Reflect.getMetadata("imports", AppModule);
    expect(imports).toEqual([]);
  });

  it("should allow dependency injection between services", () => {
    // Test that TestExecutionService can be injected with its dependencies
    const testExecutionService =
      module.get<TestExecutionService>(TestExecutionService);
    expect(testExecutionService).toBeDefined();

    // Test that all dependencies are available
    const httpClientService = module.get<HttpClientService>(HttpClientService);
    const mutationGeneratorService = module.get<MutationGeneratorService>(
      MutationGeneratorService
    );
    const vulnerabilityDetectorService =
      module.get<VulnerabilityDetectorService>(VulnerabilityDetectorService);
    const metricsService = module.get<MetricsService>(MetricsService);

    expect(httpClientService).toBeDefined();
    expect(mutationGeneratorService).toBeDefined();
    expect(vulnerabilityDetectorService).toBeDefined();
    expect(metricsService).toBeDefined();
  });
});
