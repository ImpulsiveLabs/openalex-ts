import { AxiosInstance } from "axios";
import { OpenAlexConfig } from "../types/config";
import { KeywordResponse } from "../types/types";
import { Entity } from "./generic";

export default class Keyword extends Entity<KeywordResponse> {
    constructor(config: OpenAlexConfig, axiosInstance: AxiosInstance) {
        super(config, 'keywords', axiosInstance);
    }
}
