import { AxiosInstance } from "axios";
import { OpenAlexConfig } from "../types/config";
import { SourceResponse } from "../types/types";
import { Entity } from "./generic";

export default class Source extends Entity<SourceResponse> {
    constructor(config: OpenAlexConfig, axiosInstance: AxiosInstance) {
        super(config, 'sources', axiosInstance);
    }
}
