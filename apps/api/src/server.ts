import { serve } from "@hono/node-server";
import { createAuthResolver } from "./auth/session";
import {
  ApiRuntimeConfigError,
  resolveApiRuntimeConfig,
} from "./config/runtime";
import { createContentApiModule } from "./content/content-module";
import { createApiApp } from "./create-app";
import { seedDemoSimulationRun } from "./dev/seed";
import {
  createInMemorySimulationModuleRegistry,
  createPostgresSimulationModuleRegistry,
  type SimulationModuleRegistry,
} from "./module-registry";

const bootstrap = async () => {
  let config;
  try {
    config = resolveApiRuntimeConfig(process.env);
  } catch (error) {
    const message =
      error instanceof ApiRuntimeConfigError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Invalid API runtime configuration.";
    console.error(`@projectsim/api refused to start: ${message}`);
    process.exitCode = 1;
    return;
  }

  const contentModule = createContentApiModule();

  let registry: SimulationModuleRegistry;
  if (config.composition === "postgres") {
    registry = createPostgresSimulationModuleRegistry({
      connectionString: config.databaseUrl!,
      businessCaseRegistry: contentModule.registry,
    });
    console.log(
      "@projectsim/api composition=postgres (durable SimulationRun/projection/idempotency/outbox).",
    );
  } else {
    registry = createInMemorySimulationModuleRegistry({
      businessCaseRegistry: contentModule.registry,
    });
    console.log(
      "@projectsim/api composition=memory (explicit local/demo only — not production).",
    );
  }

  const resolveAuth = createAuthResolver({
    supabaseJwtSecret: config.supabaseJwtSecret,
    supabaseUrl: config.supabaseUrl,
    allowDevAuth: config.allowDevAuth,
  });

  const app = createApiApp({
    registry,
    contentModule,
    resolveAuth,
    enableDevRoutes: config.enableDevRoutes,
    allowDevAuth: config.allowDevAuth,
    enableE2eSeams: config.enableE2eSeams,
  });

  if (config.seedDemoOnBoot) {
    const seeded = await seedDemoSimulationRun(registry, {
      tenantId: config.demoTenantId,
      actorId: config.demoActorId,
      simulationRunId: config.demoRunId,
    });
    if (!seeded.ok) {
      console.error(`Demo seed failed: ${seeded.message}`);
    } else {
      console.log(
        `Demo SimulationRun seeded (${config.demoRunId} / ${config.demoTenantId} / ${config.demoActorId}).`,
      );
    }
  }

  serve({ fetch: app.fetch, port: config.port }, (info) => {
    console.log(
      `@projectsim/api listening on http://localhost:${info.port} auth=${config.authMode}`,
    );
  });
};

void bootstrap();
