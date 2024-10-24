import { Button, Key, keyboard, mouse, Point } from '@nut-tree-fork/nut-js';
// import { createCanvas, loadImage } from 'canvas';
import { desktopCapturer, screen } from 'electron';
import { openai_client } from './openai';
import { AppState, NextAction } from './types';
import { extractAction } from './extractAction';
import { ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources';

const MAX_STEPS = 50;

function getScreenDimensions(): { width: number; height: number } {
        const primaryDisplay = screen.getPrimaryDisplay();
        console.log("primaryDisplay: ", primaryDisplay.size)
        return primaryDisplay.size;
}

function getAiScaledScreenDimensions(): { width: number; height: number } {
        const { width, height } = getScreenDimensions();
        const aspectRatio = width / height;

        let scaledWidth: number;
        let scaledHeight: number;

        if (aspectRatio >= 1440 / 900) {
                // Width is the limiting factor
                scaledWidth = 1440;
                scaledHeight = Math.round(1440 / aspectRatio);
        } else {
                // Height is the limiting factor
                scaledHeight = 800;
                scaledWidth = Math.round(800 * aspectRatio);
        }

        return { width: scaledWidth, height: scaledHeight };
}

const getScreenshot = async () => {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;
        const aiDimensions = getAiScaledScreenDimensions();
        console.log("aiDimensions: ", aiDimensions)

        const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width, height },
        });
        const primarySource = sources[0]; // Assuming the first source is the primary display

        if (primarySource) {
                const screenshot = primarySource.thumbnail;
                // Resize the screenshot to AI dimensions
                const resizedScreenshot = screenshot.resize(aiDimensions);
                // Convert the resized screenshot to a base64-encoded PNG
                const base64Image = resizedScreenshot.toPNG().toString('base64');
                return base64Image;
        }
        throw new Error('No display found for screenshot');
};

const mapToAiSpace = (x: number, y: number) => {
        const { width, height } = getScreenDimensions();
        const aiDimensions = getAiScaledScreenDimensions();
        return {
                x: (x * aiDimensions.width) / width,
                y: (y * aiDimensions.height) / height,
        };
};

const mapFromAiSpace = (x: number, y: number) => {
        const { width, height } = getScreenDimensions();
        const aiDimensions = getAiScaledScreenDimensions();
        return {
                x: (x * width) / aiDimensions.width,
                y: (y * height) / aiDimensions.height,
        };
};

const promptForAction = async (
        runHistory: ChatCompletionMessageParam[]
): Promise<ChatCompletionMessageParam> => {

        const message = await openai_client.chat.completions.create({
                messages: [
                        {
                                role: "system",
                                content: [
                                        {
                                                type: "text",
                                                text: "The user will ask you to complete a task and you must use their computer to do so. After each step, take a screenshot using the command screenshot({}) and carefully assess whether you have achieved the desired result. Clearly show your thoughts: \"I assessed step X\". If the result is not correct, try again. Only when you are sure that the step has been completed correctly, proceed to the next one. Note that before entering a URL, you need to click on the browser'\''s address bar. Always call the tool! Always return the tool call.\n\nRespond only in the format described below. You are not allowed to respond in any other way except for the commands: screenshot, mouse_move, left_click, type. Only the command in responses, no arbitrary text.\n\nWhen you need to get a screenshot of the screen to understand where to go, you should write: screenshot({})\n\nIf you need to move the mouse cursor to complete the task, send me a message in the format: mouse_move({ \"x\": value of the cursor on the screen on the x-axis, \"y\": value of the cursor on the screen on the y-axis })\n\nIf you need to click the left mouse button to complete the task, you should send me a message in the format: left_click({})\n\nIf you need to type some text into a field to complete the task, you should send me a message in the format: type({ \"text\": the text to be entered into the input field })\n\nIf you need to press a button on the keyboard to complete the task, you should send me a message in the format: key({ \"text\": the name of the button, such as Enter or Return })\n\nWhen the task is completed, send me a message in the format: finish({})\n\nRemember, my screen size is 1440/900, which means that the screenshots I send have this size, so you should provide more precise coordinates for the cursor.\n\nAlso, remember that you can'\''t use the ` symbol for command highlighting. The message with the command should be presented as text without highlights."
                                        }
                                ]
                        },
                        ...runHistory,
                ],
                model: 'gpt-4o',
                temperature: 0.05,
                max_tokens: 2048,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                response_format: {
                        "type": "text"
                },
        });

        console.log("RETURN FROM GPT: ", message.choices[0].message)

        return { content: message.choices[0].message.content, role: message.choices[0].message.role };
};

export const performAction = async (action: NextAction) => {
        switch (action.type) {
                case 'mouse_move':
                        const { x, y } = mapFromAiSpace(action.x, action.y);
                        await mouse.setPosition(new Point(x, y));
                        break;
                case 'left_click':
                        await mouse.leftClick();
                        break;
                case 'right_click':
                        await mouse.rightClick();
                        break;
                case 'type':
                        // Set typing delay to 0ms for instant typing
                        keyboard.config.autoDelayMs = 0;
                        await keyboard.type(action.text);
                        // Reset delay back to default if needed
                        keyboard.config.autoDelayMs = 500;
                        break;
                case 'key':
                        const keyMap = {
                                Enter: Key.Enter,
                        };
                        const keys = action.text.split('+').map((key) => {
                                const mappedKey = keyMap[key as keyof typeof keyMap];
                                if (!mappedKey) {
                                        throw new Error(`Tried to press unknown key: ${key}`);
                                }
                                return mappedKey;
                        });
                        console.log("keys: ", keys)
                        await keyboard.pressKey(...keys);
                        break;
                case 'screenshot':
                        // Don't do anything since we always take a screenshot after each step
                        break;
                default:
                throw new Error(`Unsupported action: ${action.type}`);
        }
};

export const runAgent = async (
        setState: (state: AppState) => void,
        getState: () => AppState,
) => {
        setState({
                ...getState(),
                running: true,
                runHistory: [
                        { role: 'user', content: getState().instructions ?? '' }
                ],
                error: null,
        });

        while (getState().running) {
                // Add this check at the start of the loop
                if (getState().runHistory.length >= MAX_STEPS * 2) {
                        setState({
                                ...getState(),
                                error: 'Maximum steps exceeded',
                                running: false,
                        });
                        break;
                }

                try {
                        const message = await promptForAction(getState().runHistory);
                        setState({
                                ...getState(),
                                runHistory: [...getState().runHistory, message],
                        });
                        const { action } = extractAction(
                                message as ChatCompletionMessage,
                        );
                        console.log('ACTION', action);

                        if (action.type === 'error') {
                                setState({
                                        ...getState(),
                                        error: action.message,
                                        running: false,
                                });
                                break;
                        } else if (action.type === 'finish') {
                                setState({
                                        ...getState(),
                                        running: false,
                                });
                                break;
                        }
                        if (!getState().running) {
                                break;
                        }
                        performAction(action);

                        await new Promise((resolve) => setTimeout(resolve, 500));
                        if (!getState().running) {
                                break;
                        }

                        setState({
                                ...getState(),
                                runHistory: [
                                        ...getState().runHistory,
                                        {
                                                role: "user",
                                                content: [
                                                        {
                                                                type: 'text',
                                                                text: `Here is a screenshot after the action was executed.`,
                                                        },
                                                        {
                                                                type: "image_url",
                                                                image_url: {
                                                                        url: `data:image/png;base64, ${await getScreenshot()}`,
                                                                        detail: "high"
                                                                }
                                                        }

                                                ],
                                        },
                                ],
                        });
                } catch (error: unknown) {
                        setState({
                                ...getState(),
                                error:
                                error instanceof Error ? error.message : 'An unknown error occurred',
                                running: false,
                        });
                        break;
                }
  }
};
