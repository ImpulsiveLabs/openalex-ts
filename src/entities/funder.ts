import { AxiosInstance } from "axios";
import { OpenAlexConfig } from "../types/config";
import { FunderResponse } from "../types/types";
import { Entity } from "./generic";

export default class Funder extends Entity<FunderResponse> {
    constructor(config: OpenAlexConfig, axiosInstance: AxiosInstance) {
        super(config, 'funders', axiosInstance);
    }
}
