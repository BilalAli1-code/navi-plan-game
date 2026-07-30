import {
  createHarborLogisticsRecoveryPackage,
  createNorthstarConnectedCarePackage,
  isSelectableForNewRuns,
  validateBusinessCasePackage,
} from "../packages/domain/src/index.ts";

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const catalogMode = args.includes("--catalog");
const caseId = getArg("--case");
const version = getArg("--version") ?? "1.0.0";

const fixtures: Record<
  string,
  () => ReturnType<typeof createNorthstarConnectedCarePackage>
> = {
  "northstar-connected-care": createNorthstarConnectedCarePackage,
  "harbor-logistics-recovery": createHarborLogisticsRecoveryPackage,
};

if (catalogMode) {
  const results = Object.entries(fixtures).map(([id, factory]) => {
    const pkg = factory();
    const result = validateBusinessCasePackage(pkg);
    const selectable = isSelectableForNewRuns(pkg, result);
    return {
      id,
      status: result.status,
      selectable,
      errors: result.errors.length,
    };
  });
  console.log(JSON.stringify({ catalog: results }, null, 2));
  process.exit(results.every((r) => r.selectable) ? 0 : 1);
}

if (!caseId || !fixtures[caseId]) {
  console.error(
    "Usage: pnpm content:validate --case <id> --version <semver> | --catalog",
  );
  console.error(`Known cases: ${Object.keys(fixtures).join(", ")}`);
  process.exit(1);
}

const pkg = fixtures[caseId]!();
if (pkg.manifest.contentVersion !== version) {
  console.error(
    `Fixture version is ${pkg.manifest.contentVersion}, requested ${version}`,
  );
  process.exit(1);
}

const result = validateBusinessCasePackage(pkg);
console.log(
  JSON.stringify(
    {
      businessCaseId: result.businessCaseId,
      contentVersion: result.contentVersion,
      status: result.status,
      selectable: isSelectableForNewRuns(pkg, result),
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      errors: result.errors,
      warnings: result.warnings,
    },
    null,
    2,
  ),
);
process.exit(result.status === "passed" ? 0 : 1);
