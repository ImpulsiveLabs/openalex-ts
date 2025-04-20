import { AxiosInstance, AxiosResponse } from 'axios';
import { FunderResponse } from '../../src/types/types';
import { OpenAlexConfig } from '../../src/types/config';
import OpenAlex from '../../src/openAlex';
import Funder from '../../src/entities/funder';
import { or_ } from '../../src/utils/util';

describe('Funder Entity', () => {
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

    it('should fetch funders successfully', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
    });

    it('should fetch funder with meta', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.getWithMeta();
        expect('results' in result).toBe(true);
        expect('meta' in result).toBe(true);
        expect((result as any).results.length).toBeGreaterThan(0);
        expect((result as any).meta).toHaveProperty('count');
    });

    it('should count funders', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.count();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('should fetch random funder', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.random();
        expect('id' in result).toBe(true);
        expect('display_name' in result).toBe(true);
    });

    it('should fetch funder by ID', async () => {
        const funders = openAlex.getFunder();
        const funderId = 'F4320332161';
        const result = await funders.fetchById(funderId);
        expect('id' in result).toBe(true);
        expect((result as FunderResponse).id).toBe(`https://openalex.org/${funderId}`);
    });

    it('should fetch multiple funders by IDs', async () => {
        const funders = openAlex.getFunder();
        const ids = ['F4320332161', 'F4320332162'];
        const result = await funders.fetchById(ids) as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty('id');
    });

    it('should paginate funders using cursor', async () => {
        const funders = openAlex.getFunder();
        const pager = funders.paginate('cursor', 2, 4);
        const pages: FunderResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
        expect(pages[0][0]).toHaveProperty('id');
    });

    it('should paginate funders using page', async () => {
        const funders = openAlex.getFunder();
        const pager = funders.paginate('page', 2, 4);
        const pages: FunderResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
    });

    it('should filter funders by grants count', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.filter({ grants_count: 100 }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(funder => funder.grants_count >= 100)).toBe(true);
    });

    it('should filter funders with AND', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.filterAnd({ grants_count: 100 }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(funder => funder.grants_count >= 100)).toBe(true);
    });

    it('should filter funders with OR', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.filterOr({ grants_count: or_([100, 200]) }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(funder => [100, 200].includes(funder.grants_count))).toBe(true);
    });

    it('should filter funders with NOT', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.filterNot({ grants_count: 100 }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(funder => funder.grants_count !== 100)).toBe(true);
    });

    it('should filter funders with GT', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.filterGt({ cited_by_count: 100 }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(funder => funder.cited_by_count > 100)).toBe(true);
    });

    it('should filter funders with LT', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.filterLt({ cited_by_count: 100 }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(funder => funder.cited_by_count < 100)).toBe(true);
    });

    it('should search funders', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.search('national').get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search filter funders', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.searchFilter('display_name.search', 'national').get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort funders', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.sort('cited_by_count', 'desc').get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].cited_by_count).toBeGreaterThanOrEqual(result[1].cited_by_count);
    });

    it('should select fields for funders', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.select(['id', 'display_name']).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
        expect(result[0]).not.toHaveProperty('grants_count');
    });

    it('should sample funders', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.sample(5, 42).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should group funders by field', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.groupBy('grants_count').getWithMeta();
        expect('group_by' in result).toBe(true);
        expect(Array.isArray((result as any).group_by)).toBe(true);
        expect((result as any).group_by[0]).toHaveProperty('key');
        expect((result as any).group_by[0]).toHaveProperty('count');
    });

    it('should group funders by field using get', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.groupBy('grants_count').get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('count');
    });

    it('should autocomplete funders', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.autocomplete('national');
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('display_name');
    });

    it('should serialize and deserialize funders', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        const serialized = funders.serialize(result);
        expect(typeof serialized).toBe('string');
        const deserialized = funders.deserialize(serialized) as FunderResponse[];
        expect(Array.isArray(deserialized)).toBe(true);
        expect(deserialized[0].id).toBe(result[0].id);
    });

    it('should not augment funder entities', async () => {
        const funders = openAlex.getFunder();
        const result = await funders.get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).not.toHaveProperty('abstract');
        expect(result[0]).not.toHaveProperty('ngrams');
    });

    it('should handle API errors with invalid endpoint', async () => {
        const invalidConfig = { ...config, openalexUrl: 'https://invalid.openalex.org' };
        const invalidOpenAlex = OpenAlex.getInstance(invalidConfig);
        const funders = invalidOpenAlex.getFunder();
        const result = await funders.get() as FunderResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toContain('getaddrinfo');
        invalidOpenAlex.close();
    });

    it('should retry on retryable HTTP codes', async () => {
        const retryConfig = { ...config, maxRetries: 2 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const funders = retryOpenAlex.getFunder();
        (funders as any).axiosInstance.get = jest.fn()
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockResolvedValue({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await funders.get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect((funders as any).axiosInstance.get).toHaveBeenCalledTimes(2);
        retryOpenAlex.close();
    });

    it('should handle max retries reached', async () => {
        const retryConfig = { ...config, maxRetries: 0 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const funders = retryOpenAlex.getFunder();
        (funders as any).axiosInstance.get = jest.fn().mockRejectedValue({
            response: { status: 429 },
        });
        const result = await funders.get() as FunderResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toBe('Max retries reached.');
        expect((result[0] as any).status).toBe(0);
        retryOpenAlex.close();
    });

    it('should handle session health check success', async () => {
        const funders = new Funder(config, axiosInstance);
        (funders as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await funders.get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle session health check failure with reinitialization', async () => {
        const funders = new Funder(config, axiosInstance);
        (funders as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await funders.get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.info).toHaveBeenCalledWith(`Reinitializing headers for funders.`);
    });

    it('should handle session health check exception', async () => {
        const funders = new Funder(config, axiosInstance);
        (funders as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await funders.get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.error).toHaveBeenCalledWith(`Health check exception: Error: Network error`);
    });

    it('should handle complex filter with logical expressions', async () => {
        const funders = new Funder(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await funders.filterOr({
            country_codes: or_(['US', 'UK']),
        }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/funders', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('country_codes:US|UK'),
            }),
        }));
    });

    it('should handle non-object filter in filterOr', async () => {
        const funders = new Funder(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await funders.filterOr({
            grants_count: 100,
        }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/funders', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('grants_count:100'),
            }),
        }));
    });

    it('should handle nested filter with array values', async () => {
        const funders = new Funder(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await funders.filter({
            country_codes: ['US', 'UK'],
        }).get() as FunderResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/funders', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('country_codes:US|UK'),
            }),
        }));
    });


    it('should throw on unsupported nested filter objects', async () => {
        const funders = openAlex.getFunder();
        await expect(
            funders.filter({ invalid: { nested: { deep: 1 } } }).get()
        ).rejects.toThrow('Unsupported nested object in filter');
    });
});