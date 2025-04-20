import { AxiosInstance, AxiosResponse } from 'axios';
import { InstitutionResponse } from '../../src/types/types';
import { OpenAlexConfig } from '../../src/types/config';
import OpenAlex from '../../src/openAlex';
import Institution from '../../src/entities/institution';
import { or_ } from '../../src/utils/util';

describe('Institution', () => {
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

    it('should fetch institutions successfully', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
    });

    it('should fetch institution with meta', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.getWithMeta();
        expect('results' in result).toBe(true);
        expect('meta' in result).toBe(true);
        expect((result as any).results.length).toBeGreaterThan(0);
        expect((result as any).meta).toHaveProperty('count');
    });

    it('should count institutions', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.count();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('should fetch random institution', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.random();
        expect('id' in result).toBe(true);
        expect('display_name' in result).toBe(true);
    });

    it('should fetch institution by ID', async () => {
        const institutions = openAlex.getInstitution();
        const institutionId = 'I27837315';
        const result = await institutions.fetchById(institutionId);
        expect('id' in result).toBe(true);
        expect((result as InstitutionResponse).id).toBe(`https://openalex.org/${institutionId}`);
    });

    it('should fetch multiple institutions by IDs', async () => {
        const institutions = openAlex.getInstitution();
        const ids = ['I27837315', 'I201448701'];
        const result = await institutions.fetchById(ids) as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty('id');
    });

    it('should paginate institutions using cursor', async () => {
        const institutions = openAlex.getInstitution();
        const pager = institutions.paginate('cursor', 2, 4);
        const pages: InstitutionResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
        expect(pages[0][0]).toHaveProperty('id');
    });

    it('should paginate institutions using page', async () => {
        const institutions = openAlex.getInstitution();
        const pager = institutions.paginate('page', 2, 4);
        const pages: InstitutionResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
    });

    it('should filter institutions by works count', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.filter({ works_count: 100 }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(institution => institution.works_count >= 100)).toBe(true);
    });

    it('should filter institutions with AND', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.filterAnd({ works_count: 100 }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(institution => institution.works_count >= 100)).toBe(true);
    });

    it('should filter institutions with OR', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.filterOr({ works_count: or_([100, 200]) }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(institution => [100, 200].includes(institution.works_count))).toBe(true);
    });

    it('should filter institutions with NOT', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.filterNot({ works_count: 100 }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(institution => institution.works_count !== 100)).toBe(true);
    });

    it('should filter institutions with GT', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.filterGt({ cited_by_count: 100 }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(institution => institution.cited_by_count > 100)).toBe(true);
    });

    it('should filter institutions with LT', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.filterLt({ cited_by_count: 100 }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(institution => institution.cited_by_count < 100)).toBe(true);
    });

    it('should search institutions', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.search('university').get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search filter institutions', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.searchFilter('display_name.search', 'university').get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort institutions', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.sort('cited_by_count', 'desc').get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].cited_by_count).toBeGreaterThanOrEqual(result[1].cited_by_count);
    });

    it('should select fields for institutions', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.select(['id', 'display_name']).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
        expect(result[0]).not.toHaveProperty('works_count');
    });

    it('should sample institutions', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.sample(5, 42).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should group institutions by field', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.groupBy('type').getWithMeta();
        expect('group_by' in result).toBe(true);
        expect(Array.isArray((result as any).group_by)).toBe(true);
        expect((result as any).group_by[0]).toHaveProperty('key');
        expect((result as any).group_by[0]).toHaveProperty('count');
    });

    it('should group institutions by field using get', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.groupBy('type').get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('count');
    });

    it('should autocomplete institutions', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.autocomplete('university');
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('display_name');
    });

    it('should serialize and deserialize institutions', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        const serialized = institutions.serialize(result);
        expect(typeof serialized).toBe('string');
        const deserialized = institutions.deserialize(serialized) as InstitutionResponse[];
        expect(Array.isArray(deserialized)).toBe(true);
        expect(deserialized[0].id).toBe(result[0].id);
    });

    it('should not augment institution entities', async () => {
        const institutions = openAlex.getInstitution();
        const result = await institutions.get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).not.toHaveProperty('abstract');
        expect(result[0]).not.toHaveProperty('ngrams');
    });

    it('should handle API errors with invalid endpoint', async () => {
        const invalidConfig = { ...config, openalexUrl: 'https://invalid.openalex.org' };
        const invalidOpenAlex = OpenAlex.getInstance(invalidConfig);
        const institutions = invalidOpenAlex.getInstitution();
        const result = await institutions.get() as InstitutionResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toContain('getaddrinfo');
        invalidOpenAlex.close();
    });

    it('should retry on retryable HTTP codes', async () => {
        const retryConfig = { ...config, maxRetries: 2 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const institutions = retryOpenAlex.getInstitution();
        (institutions as any).axiosInstance.get = jest.fn()
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockResolvedValue({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await institutions.get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect((institutions as any).axiosInstance.get).toHaveBeenCalledTimes(2);
        retryOpenAlex.close();
    });

    it('should handle max retries reached', async () => {
        const retryConfig = { ...config, maxRetries: 0 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const institutions = retryOpenAlex.getInstitution();
        (institutions as any).axiosInstance.get = jest.fn().mockRejectedValue({
            response: { status: 429 },
        });
        const result = await institutions.get() as InstitutionResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toBe('Max retries reached.');
        expect((result[0] as any).status).toBe(0);
        retryOpenAlex.close();
    });

    it('should handle session health check success', async () => {
        const institutions = new Institution(config, axiosInstance);
        (institutions as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await institutions.get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle session health check failure with reinitialization', async () => {
        const institutions = new Institution(config, axiosInstance);
        (institutions as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await institutions.get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.info).toHaveBeenCalledWith(`Reinitializing headers for institutions.`);
    });

    it('should handle session health check exception', async () => {
        const institutions = new Institution(config, axiosInstance);
        (institutions as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await institutions.get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.error).toHaveBeenCalledWith(`Health check exception: Error: Network error`);
    });

    it('should handle complex filter with logical expressions', async () => {
        const institutions = new Institution(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await institutions.filterOr({
            country_code: or_(['US', 'UK']),
        }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/institutions', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('country_code:US|UK'),
            }),
        }));
    });

    it('should handle non-object filter in filterOr', async () => {
        const institutions = new Institution(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await institutions.filterOr({
            works_count: 100,
        }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/institutions', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('works_count:100'),
            }),
        }));
    });

    it('should handle nested filter with array values', async () => {
        const institutions = new Institution(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await institutions.filter({
            'associated_institutions.id': ['I123456789', 'I987654321'],
        }).get() as InstitutionResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/institutions', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('associated_institutions.id:I123456789|I987654321'),
            }),
        }));
    });

    it('should throw on unsupported nested filter objects', async () => {
        const institutions = openAlex.getInstitution();
        await expect(
            institutions.filter({ invalid: { nested: { deep: 1 } } }).get()
        ).rejects.toThrow('Unsupported nested object in filter');
    });
});