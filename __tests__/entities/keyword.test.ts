import { AxiosInstance } from 'axios';
import { KeywordResponse } from '../../src/types/types';
import { OpenAlexConfig } from '../../src/types/config';
import OpenAlex from '../../src/openAlex';
import Keyword from '../../src/entities/keyword';
import { or_ } from '../../src/utils/util';

describe('Keyword', () => {
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

    it('should fetch keywords successfully', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
    });

    it('should fetch keyword with meta', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.getWithMeta();
        expect('results' in result).toBe(true);
        expect('meta' in result).toBe(true);
        expect((result as any).results.length).toBeGreaterThan(0);
        expect((result as any).meta).toHaveProperty('count');
    });

    it('should count keywords', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.count();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    // it('should fetch random keyword', async () => {
    //     const keywords = openAlex.getKeyword();
    //     const result = await keywords.random();
    //     console.log(result)
    //     expect('id' in result).toBe(true);
    //     expect('display_name' in result).toBe(true);
    // });

    it('should fetch keyword by ID', async () => {
        const keywords = openAlex.getKeyword();
        const keywordId = 'cardiac-imaging';
        const result = await keywords.fetchById(keywordId);
        expect('id' in result).toBe(true);
        expect((result as KeywordResponse).id).toBe(`https://openalex.org/keywords/${keywordId}`);
    });

    // it('should fetch multiple keywords by IDs', async () => {
    //     const keywords = openAlex.getKeyword();
    //     const ids = ['cardiac-imaging', 'artificial-general-intelligence'];
    //     const result = await keywords.fetchById(ids) as KeywordResponse[];
    //     console.log(result)
    //     expect(Array.isArray(result)).toBe(true);
    //     expect(result.length).toBe(2);
    //     expect(result[0]).toHaveProperty('id');
    // });

    it('should paginate keywords using cursor', async () => {
        const keywords = openAlex.getKeyword();
        const pager = keywords.paginate('cursor', 2, 4);
        const pages: KeywordResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
        expect(pages[0][0]).toHaveProperty('id');
    });

    it('should paginate keywords using page', async () => {
        const keywords = openAlex.getKeyword();
        const pager = keywords.paginate('page', 2, 4);
        const pages: KeywordResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
    });

    it('should filter keywords by works count', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.filter({ works_count: 100 }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(keyword => keyword.works_count >= 100)).toBe(true);
    });

    it('should filter keywords with AND', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.filterAnd({ works_count: 100 }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(keyword => keyword.works_count >= 100)).toBe(true);
    });

    it('should filter keywords with OR', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.filterOr({ works_count: or_([100, 200]) }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(keyword => [100, 200].includes(keyword.works_count))).toBe(true);
    });

    it('should filter keywords with NOT', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.filterNot({ works_count: 100 }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(keyword => keyword.works_count !== 100)).toBe(true);
    });

    it('should filter keywords with GT', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.filterGt({ cited_by_count: 100 }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(keyword => keyword.cited_by_count > 100)).toBe(true);
    });

    it('should filter keywords with LT', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.filterLt({ cited_by_count: 100 }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(keyword => keyword.cited_by_count < 100)).toBe(true);
    });

    it('should search keywords', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.search('machine learning').get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search filter keywords', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.searchFilter('display_name.search', 'machine learning').get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort keywords', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.sort('cited_by_count', 'desc').get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].cited_by_count).toBeGreaterThanOrEqual(result[1].cited_by_count);
    });

    it('should select fields for keywords', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.select(['id', 'display_name']).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
        expect(result[0]).not.toHaveProperty('works_count');
    });

    it('should sample keywords', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.sample(5, 42).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should group keywords by field', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.groupBy('works_count').getWithMeta();
        expect('group_by' in result).toBe(true);
        expect(Array.isArray((result as any).group_by)).toBe(true);
        expect((result as any).group_by[0]).toHaveProperty('key');
        expect((result as any).group_by[0]).toHaveProperty('count');
    });

    it('should group keywords by field using get', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.groupBy('works_count').get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('count');
    });

    it('should autocomplete keywords', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.autocomplete('machine');
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('display_name');
    });

    it('should serialize and deserialize keywords', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        const serialized = keywords.serialize(result);
        expect(typeof serialized).toBe('string');
        const deserialized = keywords.deserialize(serialized) as KeywordResponse[];
        expect(Array.isArray(deserialized)).toBe(true);
        expect(deserialized[0].id).toBe(result[0].id);
    });

    it('should not augment keyword entities', async () => {
        const keywords = openAlex.getKeyword();
        const result = await keywords.get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).not.toHaveProperty('abstract');
        expect(result[0]).not.toHaveProperty('ngrams');
    });

    it('should handle API errors with invalid endpoint', async () => {
        const invalidConfig = { ...config, openalexUrl: 'https://invalid.openalex.org' };
        const invalidOpenAlex = OpenAlex.getInstance(invalidConfig);
        const keywords = invalidOpenAlex.getKeyword();
        const result = await keywords.get() as KeywordResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toContain('getaddrinfo');
        invalidOpenAlex.close();
    });

    it('should retry on retryable HTTP codes', async () => {
        const retryConfig = { ...config, maxRetries: 2 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const keywords = retryOpenAlex.getKeyword();
        (keywords as any).axiosInstance.get = jest.fn()
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockResolvedValue({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await keywords.get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect((keywords as any).axiosInstance.get).toHaveBeenCalledTimes(2);
        retryOpenAlex.close();
    });

    it('should handle max retries reached', async () => {
        const retryConfig = { ...config, maxRetries: 0 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const keywords = retryOpenAlex.getKeyword();
        (keywords as any).axiosInstance.get = jest.fn().mockRejectedValue({
            response: { status: 429 },
        });
        const result = await keywords.get() as KeywordResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toBe('Max retries reached.');
        expect((result[0] as any).status).toBe(0);
        retryOpenAlex.close();
    });

    it('should handle session health check success', async () => {
        const keywords = new Keyword(config, axiosInstance);
        (keywords as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await keywords.get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle session health check failure with reinitialization', async () => {
        const keywords = new Keyword(config, axiosInstance);
        (keywords as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await keywords.get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.info).toHaveBeenCalledWith(`Reinitializing headers for keywords.`);
    });

    it('should handle session health check exception', async () => {
        const keywords = new Keyword(config, axiosInstance);
        (keywords as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await keywords.get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.error).toHaveBeenCalledWith(`Health check exception: Error: Network error`);
    });

    it('should handle complex filter with logical expressions', async () => {
        const keywords = new Keyword(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await keywords.filterOr({
            display_name: or_(['machine learning', 'artificial intelligence']),
        }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/keywords', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('display_name:machine learning|artificial intelligence'),
            }),
        }));
    });

    it('should handle non-object filter in filterOr', async () => {
        const keywords = new Keyword(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await keywords.filterOr({
            works_count: 100,
        }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/keywords', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('works_count:100'),
            }),
        }));
    });

    it('should handle nested filter with array values', async () => {
        const keywords = new Keyword(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await keywords.filter({
            'id': ['C71915640', 'C71915641'],
        }).get() as KeywordResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/keywords', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('id:C71915640|C71915641'),
            }),
        }));
    });

    it('should throw on unsupported nested filter objects', async () => {
        const keywords = openAlex.getKeyword();
        await expect(
            keywords.filter({ invalid: { nested: { deep: 1 } } }).get()
        ).rejects.toThrow('Unsupported nested object in filter');
    });
});