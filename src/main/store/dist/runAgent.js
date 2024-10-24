"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.runAgent = exports.performAction = void 0;
var nut_js_1 = require("@nut-tree-fork/nut-js");
// import { createCanvas, loadImage } from 'canvas';
var electron_1 = require("electron");
var openai_1 = require("./openai");
var extractAction_1 = require("./extractAction");
var MAX_STEPS = 50;
function getScreenDimensions() {
    var primaryDisplay = electron_1.screen.getPrimaryDisplay();
    return primaryDisplay.size;
}
function getAiScaledScreenDimensions() {
    var _a = getScreenDimensions(), width = _a.width, height = _a.height;
    var aspectRatio = width / height;
    var scaledWidth;
    var scaledHeight;
    if (aspectRatio > 1280 / 800) {
        // Width is the limiting factor
        scaledWidth = 1280;
        scaledHeight = Math.round(1280 / aspectRatio);
    }
    else {
        // Height is the limiting factor
        scaledHeight = 800;
        scaledWidth = Math.round(800 * aspectRatio);
    }
    return { width: scaledWidth, height: scaledHeight };
}
var getScreenshot = function () { return __awaiter(void 0, void 0, void 0, function () {
    var primaryDisplay, _a, width, height, aiDimensions, sources, primarySource, screenshot, resizedScreenshot, base64Image;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                primaryDisplay = electron_1.screen.getPrimaryDisplay();
                _a = primaryDisplay.size, width = _a.width, height = _a.height;
                aiDimensions = getAiScaledScreenDimensions();
                return [4 /*yield*/, electron_1.desktopCapturer.getSources({
                        types: ['screen'],
                        thumbnailSize: { width: width, height: height }
                    })];
            case 1:
                sources = _b.sent();
                primarySource = sources[0];
                if (primarySource) {
                    screenshot = primarySource.thumbnail;
                    resizedScreenshot = screenshot.resize(aiDimensions);
                    base64Image = resizedScreenshot.toPNG().toString('base64');
                    return [2 /*return*/, base64Image];
                }
                throw new Error('No display found for screenshot');
        }
    });
}); };
var mapToAiSpace = function (x, y) {
    var _a = getScreenDimensions(), width = _a.width, height = _a.height;
    var aiDimensions = getAiScaledScreenDimensions();
    return {
        x: (x * aiDimensions.width) / width,
        y: (y * aiDimensions.height) / height
    };
};
var mapFromAiSpace = function (x, y) {
    var _a = getScreenDimensions(), width = _a.width, height = _a.height;
    var aiDimensions = getAiScaledScreenDimensions();
    return {
        x: (x * width) / aiDimensions.width,
        y: (y * height) / aiDimensions.height
    };
};
var promptForAction = function (runHistory) { return __awaiter(void 0, void 0, Promise, function () {
    var historyWithoutImages, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                historyWithoutImages = runHistory.map(function (msg, index) {
                    if (index === runHistory.length - 1)
                        return msg; // Keep the last message intact
                    /*if (Array.isArray(msg.content)) {
                            return {
                                    ...msg,
                                    content: msg.content.map((item) => {
                                            if (item.type === "text") {
                                                    return {
                                                            ...item,
                                                    };
                                            }
                                    }),
                            };
                    }*/
                    return msg;
                });
                return [4 /*yield*/, openai_1.openai_client.chat.completions.create({
                        messages: __spreadArrays([
                            {
                                role: "system",
                                content: [
                                    {
                                        type: "text",
                                        text: "You are an assistant helping me with tasks on my computer.\n\nThe user will ask you to complete a task, and you must use their computer to do so. After each step, take a screenshot and carefully assess whether you have achieved the desired result. Clearly show your thoughts: \"I assessed step X...\". If the result is not correct, try again. Only when you are sure that the step has been completed correctly, proceed to the next one. Note that before entering a URL, you need to click on the browser's address bar. You must always call the tool! Always return the tool call.\n\nRespond only in the format that I will describe below. You are not allowed to respond in any other way except for the commands: screenshot, mouse_move, left_click, type.\n\nWhen you need to get a screenshot of the screen to understand where I need to go, you should write: `screenshot({})`\n\nAfter you have received the screenshot and need to move the mouse cursor to complete the task I gave you, send me a message in the format: `mouse_move({ \"x\": value of the cursor on the screen on the x-axis, \"y\": value of the cursor on the screen on the y-axis })`\n\nIf you need to click the left mouse button to complete the task, you should send me a message in the format: `left_click({})`\n\nIf you need to type some text into a field to complete the task, you should send me a message in the format: `type({ \"text\": the text to be entered into the input field })`\n\nWhen task will complete send me a message in the format: `finish({})`"
                                    }
                                ]
                            }
                        ], historyWithoutImages),
                        model: 'gpt-4o',
                        temperature: 0.1,
                        max_tokens: 2048,
                        top_p: 1,
                        frequency_penalty: 0,
                        presence_penalty: 0,
                        response_format: {
                            "type": "text"
                        }
                    })];
            case 1:
                message = _a.sent();
                return [2 /*return*/, { content: message.choices[0].message.content, role: message.choices[0].message.role }];
        }
    });
}); };
exports.performAction = function (action) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, x, y;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = action.type;
                switch (_a) {
                    case 'mouse_move': return [3 /*break*/, 1];
                    case 'left_click': return [3 /*break*/, 3];
                    case 'right_click': return [3 /*break*/, 5];
                    case 'type': return [3 /*break*/, 7];
                    case 'screenshot': return [3 /*break*/, 9];
                }
                return [3 /*break*/, 10];
            case 1:
                _b = mapFromAiSpace(action.x, action.y), x = _b.x, y = _b.y;
                return [4 /*yield*/, nut_js_1.mouse.setPosition(new nut_js_1.Point(x, y))];
            case 2:
                _c.sent();
                return [3 /*break*/, 11];
            case 3: return [4 /*yield*/, nut_js_1.mouse.leftClick()];
            case 4:
                _c.sent();
                return [3 /*break*/, 11];
            case 5: return [4 /*yield*/, nut_js_1.mouse.rightClick()];
            case 6:
                _c.sent();
                return [3 /*break*/, 11];
            case 7:
                // Set typing delay to 0ms for instant typing
                nut_js_1.keyboard.config.autoDelayMs = 0;
                return [4 /*yield*/, nut_js_1.keyboard.type(action.text)];
            case 8:
                _c.sent();
                // Reset delay back to default if needed
                nut_js_1.keyboard.config.autoDelayMs = 500;
                return [3 /*break*/, 11];
            case 9: 
            // Don't do anything since we always take a screenshot after each step
            return [3 /*break*/, 11];
            case 10: throw new Error("Unsupported action: " + action.type);
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.runAgent = function (setState, getState) { return __awaiter(void 0, void 0, void 0, function () {
    var message, action, _a, _b, _c, _d, _e, _f, _g, _h, error_1;
    var _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                setState(__assign(__assign({}, getState()), { running: true, runHistory: [
                        { role: 'user', content: (_j = getState().instructions) !== null && _j !== void 0 ? _j : '' }
                    ], error: null }));
                _k.label = 1;
            case 1:
                if (!getState().running) return [3 /*break*/, 8];
                // Add this check at the start of the loop
                if (getState().runHistory.length >= MAX_STEPS * 2) {
                    setState(__assign(__assign({}, getState()), { error: 'Maximum steps exceeded', running: false }));
                    return [3 /*break*/, 8];
                }
                _k.label = 2;
            case 2:
                _k.trys.push([2, 6, , 7]);
                return [4 /*yield*/, promptForAction(getState().runHistory)];
            case 3:
                message = _k.sent();
                setState(__assign(__assign({}, getState()), { runHistory: __spreadArrays(getState().runHistory, [message]) }));
                action = extractAction_1.extractAction(message).action;
                console.log('ACTION', action);
                if (action.type === 'error') {
                    setState(__assign(__assign({}, getState()), { error: action.message, running: false }));
                    return [3 /*break*/, 8];
                }
                else if (action.type === 'finish') {
                    setState(__assign(__assign({}, getState()), { running: false }));
                    return [3 /*break*/, 8];
                }
                if (!getState().running) {
                    return [3 /*break*/, 8];
                }
                exports.performAction(action);
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
            case 4:
                _k.sent();
                if (!getState().running) {
                    return [3 /*break*/, 8];
                }
                _a = setState;
                _b = [__assign({}, getState())];
                _c = {};
                _d = [getState().runHistory];
                _e = {
                    role: "user"
                };
                _f = [{
                        type: 'text',
                        text: 'Here is a screenshot after the action was executed'
                    }];
                _g = {
                    type: "image_url"
                };
                _h = {};
                return [4 /*yield*/, getScreenshot()];
            case 5:
                _a.apply(void 0, [__assign.apply(void 0, _b.concat([(_c.runHistory = __spreadArrays.apply(void 0, _d.concat([[
                                (_e.content = _f.concat([
                                    (_g.image_url = (_h.url = _k.sent(),
                                        _h),
                                        _g)
                                ]),
                                    _e)
                            ]])), _c)]))]);
                return [3 /*break*/, 7];
            case 6:
                error_1 = _k.sent();
                setState(__assign(__assign({}, getState()), { error: error_1 instanceof Error ? error_1.message : 'An unknown error occurred', running: false }));
                return [3 /*break*/, 8];
            case 7: return [3 /*break*/, 1];
            case 8: return [2 /*return*/];
        }
    });
}); };
