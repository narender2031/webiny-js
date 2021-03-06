import { applyContextPlugins } from "@webiny/graphql";
import { HandlerContext, HandlerPlugin } from "@webiny/handler/types";
import { createResponse } from "@webiny/handler";
import headlessPlugins from "../../content/plugins";
import { generateContentModelIndexes } from "./generateContentModelIndexes";
import { generateRevisionIndexes } from "./generateRevisionIndexes";
import { deleteRevisionIndexes } from "./deleteRevisionIndexes";
import { deleteEnvironmentData } from "./deleteEnvironmentData";
import { Action } from "../types";
import { copyEnvironment } from "./copyEnvironment";
import { CmsDataManagerEntryHookPlugin } from "@webiny/api-headless-cms/dataManager/types";

// Setup plugins for given environment
async function setupEnvironment(context, environment) {
    context.plugins.register(await headlessPlugins({ type: "manage", environment }));
    await applyContextPlugins(context);
}

const processEntryHooks = async (payload, context: HandlerContext) => {
    const plugins = context.plugins.byType<CmsDataManagerEntryHookPlugin>(
        "cms-data-manager-entry-hook"
    );

    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        try {
            await plugin.hook(payload, context);
        } catch {
            // We completely ignore errors in hooks, since those are 3rd party plugins.
        }
    }
};

export default () => [
    {
        type: "handler",
        name: "handler-data-manager",
        async handle({ args, context }) {
            const [event] = args;
            const { environment, action, ...params } = event;

            try {
                let result;
                switch (action as Action) {
                    case "generateContentModelIndexes":
                        if (!params.contentModel) {
                            throw Error(`[${action}] Missing required parameters "contentModel"!`);
                        }

                        await setupEnvironment(context, environment);

                        result = await generateContentModelIndexes({ context, ...params });
                        break;
                    case "generateRevisionIndexes":
                        if (!params.contentModel || !params.revision) {
                            throw Error(
                                `[${action}] Missing required parameters "contentModel" and "revision"!`
                            );
                        }

                        await setupEnvironment(context, environment);

                        result = await generateRevisionIndexes({ context, ...params });

                        await processEntryHooks(
                            {
                                type: "entry-update",
                                environment,
                                contentModel: params.contentModel,
                                entry: result
                            },
                            context
                        );

                        break;
                    case "deleteRevisionIndexes":
                        if (!params.contentModel || !params.revision) {
                            throw Error(
                                `[${action}] Missing required parameters "contentModel" and "revision"!`
                            );
                        }

                        await setupEnvironment(context, environment);

                        result = await deleteRevisionIndexes({ context, ...params });

                        await processEntryHooks(
                            {
                                type: "entry-delete",
                                environment,
                                contentModel: params.contentModel,
                                entry: result
                            },
                            context
                        );

                        break;
                    case "copyEnvironment":
                        if (!params.copyFrom || !params.copyTo) {
                            throw Error(
                                `[${action}] Missing required parameters "copyFrom" and "copyTo"!`
                            );
                        }

                        await applyContextPlugins(context);

                        result = await copyEnvironment({ context, ...params });
                        break;
                    case "deleteEnvironment":
                        await applyContextPlugins(context);

                        result = await deleteEnvironmentData({ context, environment });
                        break;
                    default:
                        throw Error(`Unknown action "${action}"!`);
                }

                return createResponse({
                    type: "application/json",
                    body: JSON.stringify({ action, result })
                });
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    } as HandlerPlugin
];
