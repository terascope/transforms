
const { DataEntity } = require ('@terascope/job-components');
const path = require('path');
const _ = require('lodash');
const TestHarness = require('./test-harness');

fdescribe('matcher', () => {
    const matchRules1Path = path.join(__dirname, './fixtures/matchRules1.txt');

    let opTest;

    beforeEach(() => {
        opTest = new TestHarness;
    });

    it('can return matching documents', async () => {
        //TODO: file path needs to be from asset
        const opConfig = {
            _op: 'watcher',
            file_path: matchRules1Path,
            selector_config: { _created: 'date' },
            type: 'matcher'
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: "2018-12-16T15:16:09.076Z" }
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(3);
    });

    it('it add metadata to returning docs', async () => {
        const opConfig = {
            _op: 'watcher',
            file_path: matchRules1Path,
            selector_config: { _created: 'date' },
            type: 'matcher'
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: "2018-12-16T15:16:09.076Z" }
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(3)
        results.forEach(doc => expect(doc.getMetadata('selectors')).toBeDefined());
    });

    it('it can match multiple rules', async () => {
        const opConfig = {
            _op: 'watcher',
            file_path: matchRules1Path,
            selector_config: { _created: 'date' },
            type: 'matcher'
        }

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200, _created: "2018-12-16T15:16:09.076Z" },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 }
        ]);

        const rules = {
            'some:data AND bytes:>=1000': true,
            'other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z': true
        };

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);
        // each match will be inserted into the results
        expect(results.length).toEqual(1);
        expect(results[0].getMetadata('selectors')).toEqual(rules);
    });
})