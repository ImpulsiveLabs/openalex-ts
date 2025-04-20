import { AxiosInstance } from 'axios';
import { PublisherResponse, Iso3166Alpha2CountryCode } from '../../src/types/types';
import { OpenAlexConfig } from '../../src/types/config';
import OpenAlex from '../../src/openAlex';
import Publisher from '../../src/entities/publisher';
import { or_ } from '../../src/utils/util';

describe('Publisher', () => {
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

    it('should initialize Publisher instance', () => {
        const publisher = new Publisher(config, axiosInstance);
        expect((publisher as any).endpoint).toBe('publishers');
        expect((publisher as any).config).toBe(config);
        expect((publisher as any).axiosInstance).toBe(axiosInstance);
        expect((publisher as any).logger).toBe(console);
        expect((publisher as any).lastActivity).toBeGreaterThan(0);
        expect((publisher as any).isConnectionActive).toBe(true);
    });

    it('should fetch publishers successfully', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
    });

    it('should fetch publisher with meta', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.getWithMeta();
        expect('results' in result).toBe(true);
        expect('meta' in result).toBe(true);
        expect((result as any).results.length).toBeGreaterThan(0);
        expect((result as any).meta).toHaveProperty('count');
    });

    it('should count publishers', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.count();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('should fetch random publisher', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.random();
        expect('id' in result).toBe(true);
        expect('display_name' in result).toBe(true);
    });

    it('should fetch publisher by ID', async () => {
        const publishers = openAlex.getPublisher();
        const publisherId = 'P4310319965';
        const result = await publishers.fetchById(publisherId);
        expect('id' in result).toBe(true);
        expect((result as PublisherResponse).id).toBe(`https://openalex.org/${publisherId}`);
    });

    it('should fetch multiple publishers by IDs', async () => {
        const publishers = openAlex.getPublisher();
        const ids = ['P4310319965', 'P4310320990'];
        const result = await publishers.fetchById(ids) as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty('id');
    });

    it('should paginate publishers using cursor', async () => {
        const publishers = openAlex.getPublisher();
        const pager = publishers.paginate('cursor', 2, 4);
        const pages: PublisherResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
        expect(pages[0][0]).toHaveProperty('id');
    });

    it('should paginate publishers using page', async () => {
        const publishers = openAlex.getPublisher();
        const pager = publishers.paginate('page', 2, 4);
        const pages: PublisherResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
    });

    it('should filter publishers by works count', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.filter({ works_count: 100 }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(publisher => publisher.works_count >= 100)).toBe(true);
    });

    it('should filter publishers with AND', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.filterAnd({ works_count: 100 }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(publisher => publisher.works_count >= 100)).toBe(true);
    });

    it('should filter publishers with OR', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.filterOr({ works_count: or_([100, 200]) }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(publisher => [100, 200].includes(publisher.works_count))).toBe(true);
    });

    it('should filter publishers with NOT', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.filterNot({ works_count: 100 }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(publisher => publisher.works_count !== 100)).toBe(true);
    });

    it('should filter publishers with GT', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.filterGt({ cited_by_count: 100 }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(publisher => publisher.cited_by_count > 100)).toBe(true);
    });

    it('should filter publishers with LT', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.filterLt({ cited_by_count: 100 }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(publisher => publisher.cited_by_count < 100)).toBe(true);
    });

    it('should search publishers', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.search('elsevier').get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search filter publishers', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.searchFilter('display_name.search', 'elsevier').get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort publishers', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.sort('cited_by_count', 'desc').get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].cited_by_count).toBeGreaterThanOrEqual(result[1].cited_by_count);
    });

    it('should select fields for publishers', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.select(['id', 'display_name']).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
        expect(result[0]).not.toHaveProperty('works_count');
    });

    it('should sample publishers', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.sample(5, 42).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should group publishers by field', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.groupBy('hierarchy_level').getWithMeta();
        expect('group_by' in result).toBe(true);
        expect(Array.isArray((result as any).group_by)).toBe(true);
        expect((result as any).group_by[0]).toHaveProperty('key');
        expect((result as any).group_by[0]).toHaveProperty('count');
    });

    it('should group publishers by field using get', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.groupBy('hierarchy_level').get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('count');
    });

    it('should autocomplete publishers', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.autocomplete('elsevier');
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('display_name');
    });

    it('should serialize and deserialize publishers', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        const serialized = publishers.serialize(result);
        expect(typeof serialized).toBe('string');
        const deserialized = publishers.deserialize(serialized) as PublisherResponse[];
        expect(Array.isArray(deserialized)).toBe(true);
        expect(deserialized[0].id).toBe(result[0].id);
    });

    it('should not augment publisher entities', async () => {
        const publishers = openAlex.getPublisher();
        const result = await publishers.get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).not.toHaveProperty('abstract');
        expect(result[0]).not.toHaveProperty('ngrams');
    });

    it('should handle API errors with invalid endpoint', async () => {
        const invalidConfig = { ...config, openalexUrl: 'https://invalid.openalex.org' };
        const invalidOpenAlex = OpenAlex.getInstance(invalidConfig);
        const publishers = invalidOpenAlex.getPublisher();
        const result = await publishers.get() as PublisherResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toContain('getaddrinfo');
        invalidOpenAlex.close();
    });

    it('should retry on retryable HTTP codes', async () => {
        const retryConfig = { ...config, maxRetries: 2 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const publishers = retryOpenAlex.getPublisher();
        (publishers as any).axiosInstance.get = jest.fn()
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockResolvedValue({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await publishers.get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect((publishers as any).axiosInstance.get).toHaveBeenCalledTimes(2);
        retryOpenAlex.close();
    });

    it('should handle max retries reached', async () => {
        const retryConfig = { ...config, maxRetries: 0 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const publishers = retryOpenAlex.getPublisher();
        (publishers as any).axiosInstance.get = jest.fn().mockRejectedValue({
            response: { status: 429 },
        });
        const result = await publishers.get() as PublisherResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toBe('Max retries reached.');
        expect((result[0] as any).status).toBe(0);
        retryOpenAlex.close();
    });

    it('should handle session health check success', async () => {
        const publishers = new Publisher(config, axiosInstance);
        (publishers as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await publishers.get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle session health check failure with reinitialization', async () => {
        const publishers = new Publisher(config, axiosInstance);
        (publishers as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await publishers.get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.info).toHaveBeenCalledWith(`Reinitializing headers for publishers.`);
    });

    it('should handle session health check exception', async () => {
        const publishers = new Publisher(config, axiosInstance);
        (publishers as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await publishers.get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.error).toHaveBeenCalledWith(`Health check exception: Error: Network error`);
    });

    it('should handle complex filter with logical expressions', async () => {
        const publishers = new Publisher(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await publishers.filterOr({
            country_codes: or_([Iso3166Alpha2CountryCode.UnitedStates, Iso3166Alpha2CountryCode.UnitedKingdom]),
        }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/publishers', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('country_codes:US|GB'),
            }),
        }));
    });

    it('should handle non-object filter in filterOr', async () => {
        const publishers = new Publisher(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await publishers.filterOr({
            works_count: 100,
        }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/publishers', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('works_count:100'),
            }),
        }));
    });

    it('should handle nested filter with array values', async () => {
        const publishers = new Publisher(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await publishers.filter({
            'lineage': ['P4310319965', 'P4310319966'],
        }).get() as PublisherResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/publishers', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('lineage:P4310319965|P4310319966'),
            }),
        }));
    });

    it('should throw on unsupported nested filter objects', async () => {
        const publishers = openAlex.getPublisher();
        await expect(
            publishers.filter({ invalid: { nested: { deep: 1 } } }).get()
        ).rejects.toThrow('Unsupported nested object in filter');
    });
});