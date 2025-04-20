import { AxiosInstance } from "axios";
import { OpenAlexConfig } from "../types/config";
import { InstitutionResponse } from "../types/types";
import { Entity } from "./generic";

export default class Institution extends Entity<InstitutionResponse> {
    constructor(config: OpenAlexConfig, axiosInstance: AxiosInstance) {
        super(config, 'institutions', axiosInstance);
    }
}
