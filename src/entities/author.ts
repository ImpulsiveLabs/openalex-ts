import { AxiosInstance } from "axios";
import { OpenAlexConfig } from "../types/config";
import { AuthorResponse } from "../types/types";
import { Entity } from "./generic";

export default class Author extends Entity<AuthorResponse> {
    constructor(config: OpenAlexConfig, axiosInstance: AxiosInstance) {
        super(config, 'authors', axiosInstance);
    }
}
