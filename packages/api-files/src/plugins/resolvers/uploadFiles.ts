import { Response, ErrorResponse } from "@webiny/graphql";
import getPreSignedPostPayload from "./utils/getPresignedPostPayload";
import { BATCH_UPLOAD_MAX_FILES } from "./utils/constants";

export default async (root: any, args: { [key: string]: any }, context) => {
    const { data: files } = args;
    const settings = await context.settingsManager.getSettings("file-manager");

    if (!Array.isArray(files)) {
        return new ErrorResponse({
            code: "UPLOAD_FILES_NON_ARRAY",
            message: `"data" argument must be an array.`
        });
    }

    if (files.length === 0) {
        return new ErrorResponse({
            code: "UPLOAD_FILES_MIN_FILES",
            message: `"data" argument must contain at least one file.`
        });
    }

    if (files.length > BATCH_UPLOAD_MAX_FILES) {
        return new ErrorResponse({
            code: "UPLOAD_FILES_MAX_FILES",
            message: `"data" argument must not contain more than ${BATCH_UPLOAD_MAX_FILES} files.`
        });
    }

    const promises = [];
    for (let i = 0; i < files.length; i++) {
        const item = files[i];
        promises.push(getPreSignedPostPayload(item, settings));
    }

    return new Response(await Promise.all(promises));
};
