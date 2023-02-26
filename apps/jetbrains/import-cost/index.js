const {} = require("import-cost-helpers")

class ImportCostPlugin {
  onMessage(project, messageWriter) {
    const { seq, arguments: pkg } = JSON.parse(project);
    console.log("pkg", pkg);
    console.log("seq", seq);

    messageWriter.write({
      seq,
      package: pkg
    });
  }
}

class ImportCostPluginFactory {
  create() {
    return {
      languagePlugin: new ImportCostPlugin()
    };
  }
}

module.exports = {
  factory: new ImportCostPluginFactory()
};
