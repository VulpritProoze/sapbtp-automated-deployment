import { Command } from "commander";
import { createApiClient } from "./api/client";
import { runDeployCommand } from "./commands/deploy";
import { runDiffCommand } from "./commands/diff";
import { runInitCommand } from "./commands/init";
import { runPullCommand } from "./commands/pull";
import { runPushCommand } from "./commands/push";
import { runStatusCommand } from "./commands/status";
import { runVersionCommand } from "./commands/version";
import { loadConfig } from "./config/loader";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  const config = loadConfig();
  const apiClient = createApiClient(config.btpBaseUrl);

  const program = new Command();
  program
    .name("iflow-cli")
    .description("SAP BTP Integration Suite script collection manager")
    .showHelpAfterError();

  program
    .command("pull")
    .requiredOption("--id <collectionId>", "Script collection Id")
    .action((options) => runPullCommand(apiClient, config, options));

  program
    .command("push")
    .requiredOption("--id <collectionId>", "Script collection Id")
    .option("--deploy", "Deploy after upload")
    .option(
      "--save-version <version>",
      "Save the active script collection as a version after pushing"
    )
    .action((options) => runPushCommand(apiClient, config, options));

  program
    .command("deploy")
    .requiredOption("--id <collectionId>", "Script collection Id")
    .option("--iflow", "Deploy the associated iFlow")
    .action((options) => runDeployCommand(apiClient, config, options));

  program
    .command("diff")
    .requiredOption("--id <collectionId>", "Script collection Id")
    .action((options) => runDiffCommand(apiClient, config, options));

  program.command("status").action(() => runStatusCommand(apiClient, config));

  program
    .command("init")
    .requiredOption("--id <collectionId>", "Script collection Id")
    .option("--name <displayName>", "Display name for the collection")
    .action((options) => runInitCommand(config, options));

  program
    .command("version")
    .requiredOption("--id <collectionId>", "Script collection Id")
    .requiredOption("--new-version <version>", "The new version to save the collection as")
    .action((options) =>
      runVersionCommand(apiClient, config, { id: options.id, newVersion: options.newVersion })
    );

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
