import { BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { NextAction } from './types';
import { ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources';

export const extractAction = (
  message: ChatCompletionMessageParam,
): {
    action: NextAction;
} => {
        const not_parsed_action = String(message.content);
        let nextAction: NextAction;

        if (not_parsed_action.indexOf("screenshot({})") != -1) {
                return { action: { type: 'screenshot' } }; 
        }

        if (not_parsed_action.indexOf("left_click({})") != -1) {
                return { action: { type: 'left_click' } }; 
        }

        if (not_parsed_action.indexOf("mouse_move") != -1) {
                let index = not_parsed_action.indexOf("mouse_move")
                let action = not_parsed_action.substring(index)
                let value = JSON.parse(((String(action).substring("mouse_move".length)).replace(")", "")).replace("(", ""))  
                return { action: { type: "mouse_move", x: value.x, y: value.y } }
        }

        if (not_parsed_action.indexOf("finish({})") != -1) {
                return { action: { type: 'finish' } }; 
        }

        if (not_parsed_action.indexOf("type") != -1) {
                let index = not_parsed_action.indexOf("type")
                let action = not_parsed_action.substring(index)
                let value = JSON.parse(((String(action).substring("type".length)).replace(")", "")).replace("(", ""))  
                return { action: { type: "type", text: value.text } }
        }

        if (not_parsed_action.indexOf("key") != -1) {
                let index = not_parsed_action.indexOf("key")
                let action = not_parsed_action.substring(index)
                let value = JSON.parse(((String(action).substring("key".length)).replace(")", "")).replace("(", ""))  
                return { action: { type: "key", text: value.text } }
        }

        /*
        // Convert toolUse into NextAction
        let action_parsed = String(action).indexOf("({")
        let action_subs = String(action).substring(0, action_parsed)
        switch (action_subs) {
                case 'screenshot':
                        nextAction = { type: 'screenshot' };
                        break;
                case 'left_click':
                        nextAction = { type: "left_click" };
                        break;
                case 'mouse_move':
                        let value = JSON.parse(((String(action).substring(action_parsed)).replace(")", "")).replace("(", ""))

                        nextAction = { type: "mouse_move", x: value.x, y: value.y }
                        break;
                case "finish":
                        nextAction = { type: 'finish' };
                        break;
                default:
                        nextAction = {
                                type: 'error',
                                message: `Unsupported computer action: ${action}`,
                        };
                        break
        }*/

        

        return { action: { type: 'error', message: `Unsupported computer action: ${not_parsed_action}`} };
};
