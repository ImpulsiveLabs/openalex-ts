import { AxiosInstance } from "axios";
import { OpenAlexConfig } from "../types/config";
import { TopicResponse } from "../types/types";
import { Entity } from "./generic";

export default class Topic extends Entity<TopicResponse> {
    constructor(config: OpenAlexConfig, axiosInstance: AxiosInstance) {
        super(config, 'topics', axiosInstance);
    }
}
