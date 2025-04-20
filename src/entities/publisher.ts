import { AxiosInstance } from "axios";
import { OpenAlexConfig } from "../types/config";
import { PublisherResponse } from "../types/types";
import { Entity } from "./generic";

export default class Publisher extends Entity<PublisherResponse> {
    constructor(config: OpenAlexConfig, axiosInstance: AxiosInstance) {
        super(config, 'publishers', axiosInstance);
    }
}
