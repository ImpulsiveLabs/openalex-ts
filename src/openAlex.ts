import axios, { AxiosInstance } from 'axios';
import Author from './entities/author';
import Institution from './entities/institution';
import Keyword from './entities/keyword';
import Work from './entities/work';
import Publisher from './entities/publisher';
import Funder from './entities/funder';
import Source from './entities/source';
import Topic from './entities/topic';
import { OpenAlexConfig } from './types/config';

const defaultConfig: OpenAlexConfig = {
    openalexUrl: 'https://api.openalex.org',
    email: undefined,
    userAgent: 'openalex-ts/0.0.1',
    maxRetries: 3,
    retryBackoffFactor: 0.2,
    apiKey: undefined,
    retryHttpCodes: [429, 500, 503],
};

export default class OpenAlex {
    private static instance: OpenAlex | null = null;

    private static axiosInstance: AxiosInstance;
    private static author: Author;
    private static institution: Institution;
    private static keyword: Keyword;
    private static funder: Funder;
    private static work: Work;
    private static publisher: Publisher;
    private static source: Source;
    private static topic: Topic;
    private config: OpenAlexConfig;

    private constructor(config: Partial<OpenAlexConfig> = {}) {
        this.config = { ...defaultConfig, ...config };

        OpenAlex.axiosInstance = axios.create({
            baseURL: this.config.openalexUrl,
            headers: {
                'User-Agent': this.config.userAgent,
                'Connection': 'keep-alive',
                ...(this.config.email && { 'mailto': this.config.email }),
            },
            timeout: 10000,
        });


        OpenAlex.author = new Author(this.config, OpenAlex.axiosInstance);
        OpenAlex.institution = new Institution(this.config, OpenAlex.axiosInstance);
        OpenAlex.keyword = new Keyword(this.config, OpenAlex.axiosInstance);
        OpenAlex.funder = new Funder(this.config, OpenAlex.axiosInstance);
        OpenAlex.work = new Work(this.config, OpenAlex.axiosInstance);
        OpenAlex.publisher = new Publisher(this.config, OpenAlex.axiosInstance);
        OpenAlex.source = new Source(this.config, OpenAlex.axiosInstance);
        OpenAlex.topic = new Topic(this.config, OpenAlex.axiosInstance);

        console.log('OpenAlex factory initialized with config:', {
            openalexUrl: this.config.openalexUrl,
            email: this.config.email,
        });
    }

    public static getInstance(config: Partial<OpenAlexConfig> = {}): OpenAlex {
        if (!OpenAlex.instance) {
            console.log('Creating new OpenAlex instance.');
            OpenAlex.instance = new OpenAlex(config);
        } else {
            console.log('Reusing existing OpenAlex instance.');
            if (Object.keys(config).length > 0) {
                OpenAlex.instance.updateConfig(config);
            }
        }
        return OpenAlex.instance;
    }

    public updateConfig(config: Partial<OpenAlexConfig>): void {
        this.config = { ...this.config, ...config };

        OpenAlex.axiosInstance = axios.create({
            baseURL: this.config.openalexUrl,
            headers: {
                'User-Agent': this.config.userAgent,
                'Connection': 'keep-alive',
                ...(this.config.email && { 'mailto': this.config.email }),
            },
            timeout: 10000,
        });

        OpenAlex.author = new Author(this.config, OpenAlex.axiosInstance);
        OpenAlex.institution = new Institution(this.config, OpenAlex.axiosInstance);
        OpenAlex.keyword = new Keyword(this.config, OpenAlex.axiosInstance);
        OpenAlex.funder = new Funder(this.config, OpenAlex.axiosInstance);
        OpenAlex.work = new Work(this.config, OpenAlex.axiosInstance);
        OpenAlex.publisher = new Publisher(this.config, OpenAlex.axiosInstance);
        OpenAlex.source = new Source(this.config, OpenAlex.axiosInstance);
        OpenAlex.topic = new Topic(this.config, OpenAlex.axiosInstance);

    }

    public getAuthor(): Author {
        return OpenAlex.author;
    }

    public getInstitution(): Institution {
        return OpenAlex.institution;
    }

    public getKeyword(): Keyword {
        return OpenAlex.keyword;
    }

    public getFunder(): Funder {
        return OpenAlex.funder;
    }

    public getWork(): Work {
        return OpenAlex.work;
    }

    public getPublisher(): Publisher {
        return OpenAlex.publisher;
    }

    public getSource(): Source {
        return OpenAlex.source;
    }

    public getTopic(): Topic {
        return OpenAlex.topic;
    }

    public getConfig(): OpenAlexConfig {
        return { ...this.config };
    }

    public close(): void {
        OpenAlex.author.close();
        OpenAlex.institution.close();
        OpenAlex.keyword.close();
        OpenAlex.funder.close();
        OpenAlex.work.close();
        OpenAlex.publisher.close();
        OpenAlex.source.close();
        OpenAlex.topic.close();
        OpenAlex.instance = null;
    }
}