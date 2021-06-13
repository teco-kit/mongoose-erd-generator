#!/usr/bin/env node
var program = require("commander");
const fs = require("fs");
const util = require("util");
readdir = util.promisify(fs.readdir);
const path = require("path");
const ERD = require("../lib/ERD");


generateSvg = async (modelDirectory, backgroundColor, nameColor) => {
  const modelsPath = await readdir(modelDirectory);
  const models = [];
  for (const _model of modelsPath) {
    if (
      _model.indexOf(".js") != -1 &&
      !(_model === "index.js" && program.ignoreIndex)
    ) {
      const model = require(path.join(modelDirectory, _model)).model;
      models.push(model);
    }
  }
  const svg = await ERD.generateFromModels(models, {
    format: "svg",
    collection: {
      nameColor: nameColor || "#ffffff",
      backgroundColor: backgroundColor || "#ffffff",
    },
  });
  return svg;
};

module.exports = (servePath, schemaSettings, templatePath) => {
  const templateHTML = fs.readFileSync(templatePath, 'utf8');
  var html = undefined;
  var svg = undefined;
  (async () => {
    svg = await generateSvg(schemaSettings.modelsPath, schemaSettings.backgroundColor, schemaSettings.nameColor);
    svg = svg.replace(new RegExp(/width=\"\d*..\"/gm), "")
    svg = svg.replace(new RegExp(/height=\"\d*..\"/gm), "")
    html = templateHTML.replace('fakeDbSchema', svg)
  })();
  return async (ctx, next) => {
    if (ctx.path === servePath && ctx.method == "GET" && ctx.method != "Head") {
      ctx.type = "text/html";
      ctx.body = html;
      return ctx;
    } else {
      return next();
    }
  };
};
