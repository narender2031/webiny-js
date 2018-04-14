import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { authentication } from "webiny-api-security";
import setupProject from "./configs/middleware";
import { app as webiny, graphql } from "webiny-api";

export default () => {
    setupProject();

    const app = express();

    app.use(cors());
    app.use(bodyParser.json({ limit: "50mb" }));

    app.use(
        "/graphql",
        webiny.middleware([authentication({ token: "Authorization" }), graphql({ graphiql: true })])
    );

    return app;
};
