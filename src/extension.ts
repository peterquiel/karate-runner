import providerBuildReports from "./providerBuildReports";
import providerKarateTests from "./providerKarateTests";
import providerDebugAdapter from "./providerDebugAdapter";
import providerCodeLens from "./providerCodeLens";
import providerFoldingRange from "./providerFoldingRange";
import { smartPaste, getKarateDebugFile, runKarateTest, runAllKarateTests, displayReportsTree, displayTestsTree, openBuildReport, openFileInEditor } from "./commands";
import * as vscode from 'vscode';

let buildReportsTreeView = null;
let karateTestsTreeView = null;
let buildReportsWatcher = null;
let karateTestsWatcher = null;


export function activate(context: vscode.ExtensionContext)
{
  let buildReportsProvider = new providerBuildReports();
  let karateTestsProvider = new providerKarateTests();
  let debugAdapterProvider = new providerDebugAdapter();
  let codeLensProvider = new providerCodeLens();
  let foldingRangeProvider = new providerFoldingRange();
  let codeLensTarget = { language: "feature", scheme: "file" };
  let foldingRangeTarget = { language: "feature", scheme: "file" };

  let smartPasteCommand = vscode.commands.registerCommand('karateRunner.paste', smartPaste);
  let getDebugFileCommand = vscode.commands.registerCommand("karateRunner.getDebugFile", getKarateDebugFile);
  let runTestCommand = vscode.commands.registerCommand("karateRunner.tests.run", runKarateTest);
  let runAllCommand = vscode.commands.registerCommand("karateRunner.tests.runAll", runAllKarateTests);
  let displayShallowReportsTreeCommand = vscode.commands.registerCommand("karateRunner.buildReports.displayShallow", () => displayReportsTree("Shallow"));
  let displayDeepReportsTreeCommand = vscode.commands.registerCommand("karateRunner.buildReports.displayDeep", () => displayReportsTree("Deep"));
  let displayShallowTestsTreeCommand = vscode.commands.registerCommand("karateRunner.tests.displayShallow", () => displayTestsTree("Shallow"));
  let displayDeepTestsTreeCommand = vscode.commands.registerCommand("karateRunner.tests.displayDeep", () => displayTestsTree("Deep"));
  let openReportCommand = vscode.commands.registerCommand("karateRunner.buildReports.open", openBuildReport);
  let refreshReportsTreeCommand = vscode.commands.registerCommand("karateRunner.buildReports.refreshTree", () => buildReportsProvider.refresh());
  let refreshTestsTreeCommand = vscode.commands.registerCommand("karateRunner.tests.refreshTree", () => karateTestsProvider.refresh());
  let openFileCommand = vscode.commands.registerCommand("karateRunner.tests.open", openFileInEditor);

  let registerDebugAdapterProvider = vscode.debug.registerDebugAdapterDescriptorFactory('karate', debugAdapterProvider);
  let registerCodeLensProvider = vscode.languages.registerCodeLensProvider(codeLensTarget, codeLensProvider);
  let registerFoldingRangeProvider = vscode.languages.registerFoldingRangeProvider(foldingRangeTarget, foldingRangeProvider);

  buildReportsTreeView = vscode.window.createTreeView('karate-reports', { showCollapseAll: true, treeDataProvider: buildReportsProvider });
  karateTestsTreeView = vscode.window.createTreeView('karate-tests', { showCollapseAll: true, treeDataProvider: karateTestsProvider });

  setupWatcher(
    buildReportsWatcher,
    String(vscode.workspace.getConfiguration('karateRunner.buildReports').get('toTarget')),
    buildReportsProvider
  );

  setupWatcher(
    karateTestsWatcher,
    String(vscode.workspace.getConfiguration('karateRunner.tests').get('toTarget')),
    karateTestsProvider
  )

  vscode.workspace.onDidChangeConfiguration((e) =>
  {
    let buildReportsDisplayType = e.affectsConfiguration("karateRunner.buildReports.activityBarDisplayType");
    let buildReportsToTarget = e.affectsConfiguration("karateRunner.buildReports.toTarget");

    if (buildReportsDisplayType)
    {
      buildReportsProvider.refresh();
    }

    if (buildReportsToTarget)
    {
      try
      {
        buildReportsWatcher.dispose();
      }
      catch(e)
      {
        // do nothing
      }

      setupWatcher(
        buildReportsWatcher,
        String(vscode.workspace.getConfiguration('karateRunner.buildReports').get('toTarget')),
        buildReportsProvider
      );
    }

    let karateTestsDisplayType = e.affectsConfiguration("karateRunner.tests.activityBarDisplayType");
    let karateTestsToTarget = e.affectsConfiguration("karateRunner.tests.toTarget");

    if (karateTestsDisplayType)
    {
      karateTestsProvider.refresh();
    }

    if (karateTestsToTarget)
    {
      try
      {
        karateTestsWatcher.dispose();
      }
      catch(e)
      {
        // do nothing
      }

      setupWatcher(
        karateTestsWatcher,
        String(vscode.workspace.getConfiguration('karateRunner.tests').get('toTarget')),
        karateTestsProvider
      )
    }
  });

  context.subscriptions.push(smartPasteCommand);
  context.subscriptions.push(getDebugFileCommand);
  context.subscriptions.push(runTestCommand);
  context.subscriptions.push(runAllCommand);
  context.subscriptions.push(displayShallowReportsTreeCommand);
  context.subscriptions.push(displayDeepReportsTreeCommand);
  context.subscriptions.push(displayShallowTestsTreeCommand);
  context.subscriptions.push(displayDeepTestsTreeCommand);
  context.subscriptions.push(openReportCommand);
  context.subscriptions.push(refreshReportsTreeCommand);
  context.subscriptions.push(refreshTestsTreeCommand);
  context.subscriptions.push(openFileCommand);
  context.subscriptions.push(registerDebugAdapterProvider);
  context.subscriptions.push(registerCodeLensProvider);
  context.subscriptions.push(registerFoldingRangeProvider);
}

export function deactivate()
{
  buildReportsTreeView.dispose();
  karateTestsTreeView.dispose();
  buildReportsWatcher.dispose();
  karateTestsWatcher.dispose();
}

function setupWatcher(watcher, watcherGlob, provider)
{
  watcher = vscode.workspace.createFileSystemWatcher(watcherGlob);

  watcher.onDidCreate((e) => { provider.refresh() });
  watcher.onDidChange((e) => { provider.refresh() });
  watcher.onDidDelete((e) => { provider.refresh() });

  provider.refresh();
}