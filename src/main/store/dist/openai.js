"use strict";
exports.__esModule = true;
exports.openai_client = void 0;
var dotenv_1 = require("dotenv");
var openai_1 = require("openai");
dotenv_1["default"].config();
exports.openai_client = new openai_1["default"]({
    apiKey: process.env.OPENAI_API_KEY
});
