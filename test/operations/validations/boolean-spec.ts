
import { Boolean as BooleanOp } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('boolean validation', () => {

    it('can instantiate', () => {
        const opConfig = { source_field: 'someField' };
        expect(() => new BooleanOp(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { source_field: '' };
        const badConfig3 = { source_field: {} };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new BooleanOp(badConfig1)).toThrow();
        expect(() => new BooleanOp(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new BooleanOp(badConfig3)).toThrow();
        expect(() => new BooleanOp(badConfig4)).toThrow();
    });

    it('can validate boolean fields', () => {
        const opConfig = { source_field: 'isTall' };
        const test =  new BooleanOp(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ isTall: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ isTall: 123423 }, metaData);
        const data3 = new DataEntity({ isTall: '56.234' });
        const data4 = new DataEntity({ isTall: [1324] });
        const data5 = new DataEntity({ isTall: { some: 'data' } });
        const data6 = new DataEntity({ isTall: true }, metaData);
        const data7 = new DataEntity({  isTall: 'true' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual({});
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual(data6);
        expect(DataEntity.getMetadata(results6 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results7).toEqual(data7);
    });
});
