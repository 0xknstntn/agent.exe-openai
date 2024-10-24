"use strict";
exports.__esModule = true;
exports.extractAction = void 0;
exports.extractAction = function (message) {
    var action = message.content;
    // Convert toolUse into NextAction
    var nextAction;
    var action_parsed = String(action).indexOf("({");
    var action_subs = String(action).substring(0, action_parsed);
    switch (action_subs) {
        case 'screenshot':
            nextAction = { type: 'screenshot' };
            break;
        case 'left_click':
            nextAction = { type: "left_click" };
            break;
        case 'mouse_move':
            var value = JSON.parse(((String(action).substring(action_parsed)).replace(")", "")).replace("(", ""));
            nextAction = { type: "mouse_move", x: value.x, y: value.y };
        default:
            nextAction = {
                type: 'error',
                message: "Unsupported computer action: " + action
            };
            break;
    }
    return { action: nextAction };
};
