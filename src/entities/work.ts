import { AxiosInstance } from "axios";
import { OpenAlexConfig } from "../types/config";
import { WorkResponse } from "../types/types";
import { Entity } from "./generic";

export default class Work extends Entity<WorkResponse> {
    constructor(config: OpenAlexConfig, axiosInstance: AxiosInstance) {
        super(config, 'works', axiosInstance);
    }
}
