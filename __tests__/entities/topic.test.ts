import { AxiosInstance } from 'axios';
import { TopicResponse } from '../../src/types/types';
import { OpenAlexConfig } from '../../src/types/config';
import OpenAlex from '../../src/openAlex';
import Topic from '../../src/entities/topic';
import { or_ } from '../../src/utils/util';

describe('Topic', () => {
    let config: OpenAlexConfig;
    let openAlex: OpenAlex;
    let axiosInstance: AxiosInstance;

    beforeEach(() => {
        config = {
            openalexUrl: 'https://api.openalex.org',
            email: 'your-email@example.com',
            userAgent: 'openalex-ts/0.0.1',
            maxRetries: 3,
            retryBackoffFactor: 0.2,
            retryHttpCodes: [429, 500, 503],
        };
        openAlex = OpenAlex.getInstance(config);
        axiosInstance = {
            get: jest.fn(),
            defaults: { headers: { common: {} } },
        } as unknown as AxiosInstance;
        jest.spyOn(console, 'info').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'debug').mockImplementation();
    });

    afterEach(() => {
        openAlex.close();
        jest.clearAllMocks();
    });

    it('should fetch topics successfully', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
    });

    it('should fetch topic with meta', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.getWithMeta();
        expect('results' in result).toBe(true);
        expect('meta' in result).toBe(true);
        expect((result as any).results.length).toBeGreaterThan(0);
        expect((result as any).meta).toHaveProperty('count');
    });

    it('should count topics', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.count();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('should fetch random topic', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.random();
        expect('id' in result).toBe(true);
        expect('display_name' in result).toBe(true);
    });

    it('should fetch topic by ID', async () => {
        const topics = openAlex.getTopic();
        const topicId = 'T13445';
        const result = await topics.fetchById(topicId);
        expect('id' in result).toBe(true);
        expect((result as TopicResponse).id).toBe(`https://openalex.org/${topicId}`);
    });

    // it('should fetch multiple topics by IDs', async () => {
    //     const topics = openAlex.getTopic();
    //     const ids = ['T13445', 'T11475'];
    //     const result = await topics.fetchById(ids) as TopicResponse[];
    //     expect(Array.isArray(result)).toBe(true);
    //     expect(result.length).toBe(2);
    //     expect(result[0]).toHaveProperty('id');
    // });

    it('should paginate topics using cursor', async () => {
        const topics = openAlex.getTopic();
        const pager = topics.paginate('cursor', 2, 4);
        const pages: TopicResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
        expect(pages[0][0]).toHaveProperty('id');
    });

    it('should paginate topics using page', async () => {
        const topics = openAlex.getTopic();
        const pager = topics.paginate('page', 2, 4);
        const pages: TopicResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
    });

    it('should filter topics by works count', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.filter({ works_count: 100 }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(topic => topic.works_count >= 100)).toBe(true);
    });

    it('should filter topics with AND', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.filterAnd({ works_count: 100 }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(topic => topic.works_count >= 100)).toBe(true);
    });

    it('should filter topics with OR', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.filterOr({ works_count: or_([100, 200]) }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(topic => [100, 200].includes(topic.works_count))).toBe(true);
    });

    it('should filter topics with NOT', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.filterNot({ works_count: 100 }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(topic => topic.works_count !== 100)).toBe(true);
    });

    it('should filter topics with GT', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.filterGt({ works_count: 100 }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(topic => topic.works_count > 100)).toBe(true);
    });

    it('should filter topics with LT', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.filterLt({ works_count: 100 }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(topic => topic.works_count < 100)).toBe(true);
    });

    it('should search topics', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.search('artificial intelligence').get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search filter topics', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.searchFilter('display_name.search', 'artificial intelligence').get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort topics', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.sort('works_count', 'desc').get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].works_count).toBeGreaterThanOrEqual(result[1].works_count);
    });

    it('should select fields for topics', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.select(['id', 'display_name']).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
        expect(result[0]).not.toHaveProperty('works_count');
    });

    it('should sample topics', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.sample(5, 42).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should group topics by field', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.groupBy('domain.id').getWithMeta();
        expect('group_by' in result).toBe(true);
        expect(Array.isArray((result as any).group_by)).toBe(true);
        expect((result as any).group_by[0]).toHaveProperty('key');
        expect((result as any).group_by[0]).toHaveProperty('count');
    });

    it('should group topics by field using get', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.groupBy('domain.id').get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('count');
    });

    it('should autocomplete topics', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.autocomplete('artificial');
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('display_name');
    });

    it('should serialize and deserialize topics', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        const serialized = topics.serialize(result);
        expect(typeof serialized).toBe('string');
        const deserialized = topics.deserialize(serialized) as TopicResponse[];
        expect(Array.isArray(deserialized)).toBe(true);
        expect(deserialized[0].id).toBe(result[0].id);
    });

    it('should not augment topic entities', async () => {
        const topics = openAlex.getTopic();
        const result = await topics.get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).not.toHaveProperty('abstract');
        expect(result[0]).not.toHaveProperty('ngrams');
    });

    it('should handle API errors with invalid endpoint', async () => {
        const invalidConfig = { ...config, openalexUrl: 'https://invalid.openalex.org' };
        const invalidOpenAlex = OpenAlex.getInstance(invalidConfig);
        const topics = invalidOpenAlex.getTopic();
        const result = await topics.get() as TopicResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toContain('getaddrinfo');
        invalidOpenAlex.close();
    });

    it('should retry on retryable HTTP codes', async () => {
        const retryConfig = { ...config, maxRetries: 2 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const topics = retryOpenAlex.getTopic();
        (topics as any).axiosInstance.get = jest.fn()
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockResolvedValue({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await topics.get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect((topics as any).axiosInstance.get).toHaveBeenCalledTimes(2);
        retryOpenAlex.close();
    });

    it('should handle max retries reached', async () => {
        const retryConfig = { ...config, maxRetries: 0 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const topics = retryOpenAlex.getTopic();
        (topics as any).axiosInstance.get = jest.fn().mockRejectedValue({
            response: { status: 429 },
        });
        const result = await topics.get() as TopicResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toBe('Max retries reached.');
        expect((result[0] as any).status).toBe(0);
        retryOpenAlex.close();
    });

    it('should handle session health check success', async () => {
        const topics = new Topic(config, axiosInstance);
        (topics as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await topics.get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle session health check failure with reinitialization', async () => {
        const topics = new Topic(config, axiosInstance);
        (topics as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await topics.get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.info).toHaveBeenCalledWith(`Reinitializing headers for topics.`);
    });

    it('should handle session health check exception', async () => {
        const topics = new Topic(config, axiosInstance);
        (topics as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await topics.get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.error).toHaveBeenCalledWith(`Health check exception: Error: Network error`);
    });

    it('should handle complex filter with logical expressions', async () => {
        const topics = new Topic(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await topics.filterOr({
            'subfield.id': or_(['https://openalex.org/C123456789', 'https://openalex.org/C987654321']),
        }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/topics', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('subfield.id:https://openalex.org/C123456789|https://openalex.org/C987654321'),
            }),
        }));
    });

    it('should handle non-object filter in filterOr', async () => {
        const topics = new Topic(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await topics.filterOr({
            works_count: 100,
        }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/topics', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('works_count:100'),
            }),
        }));
    });

    it('should handle nested filter with array values', async () => {
        const topics = new Topic(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await topics.filter({
            'domain.id': ['https://openalex.org/C123456789', 'https://openalex.org/C987654321'],
        }).get() as TopicResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/topics', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('domain.id:https://openalex.org/C123456789|https://openalex.org/C987654321'),
            }),
        }));
    });

    it('should throw on unsupported nested filter objects', async () => {
        const topics = openAlex.getTopic();
        await expect(
            topics.filter({ invalid: { nested: { deep: 1 } } }).get()
        ).rejects.toThrow('Unsupported nested object in filter');
    });
});