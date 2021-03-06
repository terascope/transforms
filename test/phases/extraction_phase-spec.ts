
import path from 'path';
import { DataEntity } from '@terascope/job-components';
import { ExtractionPhase, Loader } from '../../src';
import { OperationConfig } from '../../src/interfaces';
import { OperationsManager } from '../../src/operations';

describe('extraction phase', () => {

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ type: 'transform', rules: [filePath] });
        return myFileLoader.load();
    }
    // rules is only used in loader
    const transformOpconfig = { rules: ['some/path'], type: 'transform' };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules1.txt');

        expect(() => new ExtractionPhase(transformOpconfig, configList, new OperationsManager())).not.toThrow();
    });

    it('has the proper properties', async () => {
        const configList = await getConfigList('transformRules1.txt');
        const extractionPhase = new ExtractionPhase(transformOpconfig, configList, new OperationsManager());

        expect(extractionPhase.hasProcessing).toEqual(true);
        expect(extractionPhase.phase).toBeDefined();
        expect(Object.keys(extractionPhase.phase).length).toEqual(6);

        const extractions1 = extractionPhase.phase['some:data AND bytes:>=1000'];
        const extractions2 = extractionPhase.phase['hostname:www.example.com'];

        expect(Array.isArray(extractions1)).toEqual(true);
        expect(Array.isArray(extractions2)).toEqual(true);
        expect(extractions1.length).toEqual(1);
        expect(extractions2.length).toEqual(2);
    });

    it('has the proper properties with other_match_required', async () => {
        const configList = await getConfigList('transformRules16.txt');
        const extractionPhase = new ExtractionPhase(transformOpconfig, configList, new OperationsManager());

        expect(extractionPhase.hasProcessing).toEqual(true);
        expect(extractionPhase.phase).toBeDefined();
        expect(Object.keys(extractionPhase.phase).length).toEqual(1);

        const extractions = extractionPhase.phase['host:fc2.com'];

        expect(Array.isArray(extractions)).toEqual(true);
        expect(extractions.length).toEqual(2);
    });

    it('can run and extract data', async () => {
        const configList = await getConfigList('transformRules1.txt');
        const extractionPhase = new ExtractionPhase(transformOpconfig, configList, new OperationsManager());

        const data = [
            { some: 'data',  bytes: 367, myfield: 'something' },
            { other: 'zabc', myfield: 'field1=something' },
            { some: 'data', someField: 'something' },
            { hostname: 'www.example.com', pathLat: '/path/tiles/latitude/53.453', pathLon: '/path/tiles/longitude/46.343' },
            { location: '33.242, -111.453' }
        ];

        const metaArray = [
            { selectors: { 'some:data AND bytes:<=1000': true, other: 'things' } },
            { selectors: { 'other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z': true, someSpecialKey: true } },
            { selectors: { 'some:data': true, date: new Date().toISOString() } },
            { selectors: { 'hostname:www.example.com': true } },
            { selectors: { 'location:(_geo_box_top_left_: \"33.906320,  -112.758421\" _geo_box_bottom_right_:\"32.813646,-111.058902\")': true } }
        ];

        const resultsArray = [
            { topfield: { value1: 'something' } },
            { topfield: { value1: 'something' } },
            { wholeRegexResponse: 'something', partRegexResponse: 'thing' },
            { location: { lat: '53.453', lon: '46.343' } },
            { point: '33.242, -111.453' }
        ];

        const dataArray  = data.map((obj, ind) => new DataEntity(obj, metaArray[ind]));

        const results = extractionPhase.run(dataArray);

        expect(results.length).toEqual(5);
        results.forEach((result, ind) => {
            expect(result).toEqual(resultsArray[ind]);
            expect(result.getMetadata('selectors')).toEqual(metaArray[ind].selectors);
        });
    });

    it('can pick up extractions from other_match_required', async () => {
        const configList = await getConfigList('transformRules14.txt');
        const extractionPhase = new ExtractionPhase(transformOpconfig, configList, new OperationsManager());
        const key = '12345680';
        const date = new Date().toISOString();

        const data = [
            new DataEntity({ domain: 'www.example.com', url: 'http://hello.com?value=hello&value2=goodbye', date, key }, { selectors: { 'domain:example.com': true } }),
            new DataEntity({ domain: 'www.example.com', url: 'http://hello.com?value3=hello&value4=goodbye', date, key }, { selectors: { 'domain:example.com': true } })
        ];

        const results = extractionPhase.run(data);
        // removal of other_match_required happens at validations, at this point a doc is still made
        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ value: 'hello', value2: 'goodbye', date, key });
        expect(results[1]).toEqual({ date, key });
    });
});
