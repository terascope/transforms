
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../interfaces'

export default abstract class OperationBase {
    protected source: string;
    protected target: string;
    protected removeSource: boolean;

    constructor(config: OperationConfig) {
        this.source = '';
        this.target = '';
        this.removeSource = config.remove_source || false;
        this.validate(config);
    }

    protected validate(config: OperationConfig) {
        // we don't need to check target or source for selector ops
        if (this.constructor.name === 'Selector') return;
        const { target_field: targetField, source_field: sField, remove_source } = config;
        let tField = targetField || sField;
        if (remove_source && typeof remove_source !== 'boolean') throw new Error('remove_source if specified must be of type boolean')
        if (!tField || typeof tField !== 'string' || tField.length === 0) throw new Error(`could not find target_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        if (!sField || typeof sField !== 'string' || sField.length === 0) throw new Error(`could not find source_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        this.source = this.parseField(sField);
        this.target = this.parseField(tField);
    }

    protected parseField(str: string): string {
       return str.lastIndexOf('.') === -1 ?
       str : str.slice(0, str.lastIndexOf('.'));
    }

    abstract run(data: DataEntity | null): null | DataEntity
}
