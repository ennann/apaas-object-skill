/**
 * Canonical field rules for schema.create/schema.update.
 * Verified in namespace `package_5dc5b7__c` on 2026-02-10.
 *
 * Notes:
 * - `metadataType` is usually the type name returned by object.metadata.fields.
 * - Some entries are rule extensions for practical schema usage (`text_multiline`, `lookup_multi`).
 * - `schemaType` is the type name that should be sent to schema.create/update.
 */

export type MetadataFieldType =
    | 'text'
    | 'text_multiline'
    | 'bigint'
    | 'number'
    | 'date'
    | 'datetime'
    | 'option'
    | 'boolean'
    | 'lookup'
    | 'lookup_multi'
    | 'referenceField'
    | 'file'
    | 'autoId'
    | 'richText'
    | 'mobileNumber'
    | 'avatarOrLogo'
    | 'email'
    | 'region'
    | 'decimal'
    | 'multilingual';

export type SchemaFieldType =
    | 'text'
    | 'bigint'
    | 'float'
    | 'date'
    | 'datetime'
    | 'enum'
    | 'boolean'
    | 'lookup'
    | 'reference_field'
    | 'attachment'
    | 'auto_number'
    | 'richText'
    | 'phone'
    | 'avatar'
    | 'email'
    | 'region'
    | 'decimal'
    | 'multilingual';

export interface FieldCreateRule {
    metadataType: MetadataFieldType;
    schemaType: SchemaFieldType;
    settingsExample: Record<string, unknown>;
    dependsOn?: string[];
    notes?: string;
}

export const SCHEMA_TYPE_BY_METADATA_TYPE: Record<MetadataFieldType, SchemaFieldType> = {
    text: 'text',
    text_multiline: 'text',
    bigint: 'bigint',
    number: 'float',
    date: 'date',
    datetime: 'datetime',
    option: 'enum',
    boolean: 'boolean',
    lookup: 'lookup',
    lookup_multi: 'lookup',
    referenceField: 'reference_field',
    file: 'attachment',
    autoId: 'auto_number',
    richText: 'richText',
    mobileNumber: 'phone',
    avatarOrLogo: 'avatar',
    email: 'email',
    region: 'region',
    decimal: 'decimal',
    multilingual: 'multilingual'
};

export const OPTION_COLOR_LIST = [
    'blue',
    'cyan',
    'green',
    'yellow',
    'orange',
    'red',
    'magenta',
    'purple',
    'blueMagenta',
    'grey'
] as const;

export const FIELD_SCHEMA_RULES: FieldCreateRule[] = [
    {
        metadataType: 'text',
        schemaType: 'text',
        settingsExample: {
            required: false,
            unique: false,
            case_sensitive: false,
            multiline: false,
            max_length: 255
        }
    },
    {
        metadataType: 'text_multiline',
        schemaType: 'text',
        settingsExample: {
            required: false,
            unique: false,
            case_sensitive: false,
            multiline: true,
            max_length: 100000
        }
    },
    {
        metadataType: 'bigint',
        schemaType: 'bigint',
        settingsExample: {
            required: false,
            unique: false
        }
    },
    {
        metadataType: 'number',
        schemaType: 'float',
        settingsExample: {
            required: false,
            unique: false,
            display_as_percentage: false,
            decimal_places_number: 2
        },
        notes: 'Do not send create type as `number`.'
    },
    {
        metadataType: 'date',
        schemaType: 'date',
        settingsExample: {
            required: false
        }
    },
    {
        metadataType: 'datetime',
        schemaType: 'datetime',
        settingsExample: {
            required: false
        }
    },
    {
        metadataType: 'option',
        schemaType: 'enum',
        settingsExample: {
            required: false,
            multiple: false,
            option_source: 'custom',
            global_option_api_name: '',
            options: [
                {
                    label: { zh_cn: 'Option One', en_us: 'Option One' },
                    api_name: 'option_one',
                    description: null,
                    color: 'blue',
                    active: true
                },
                {
                    label: { zh_cn: 'Option Two', en_us: 'Option Two' },
                    api_name: 'option_two',
                    description: null,
                    color: 'green',
                    active: true
                }
            ]
        },
        notes: `Do not send create type as \`option\`. Available option colors: ${OPTION_COLOR_LIST.join(', ')}.`
    },
    {
        metadataType: 'boolean',
        schemaType: 'boolean',
        settingsExample: {
            default_value: true,
            description_if_true: { zh_cn: '1', en_us: '1' },
            description_if_false: { zh_cn: '0', en_us: '0' }
        }
    },
    {
        metadataType: 'lookup',
        schemaType: 'lookup',
        settingsExample: {
            required: false,
            multiple: false,
            referenced_object_api_name: '_user',
            display_as_tree: false,
            display_style: 'select'
        },
        dependsOn: ['Target object must exist first: `_user`'],
        notes: 'Single-value lookup (`multiple: false`), can be used by `reference_field`.'
    },
    {
        metadataType: 'lookup_multi',
        schemaType: 'lookup',
        settingsExample: {
            required: false,
            multiple: true,
            referenced_object_api_name: '_user',
            display_as_tree: false,
            display_style: 'select'
        },
        dependsOn: ['Target object must exist first: `_user`'],
        notes: 'Multi-value lookup (`multiple: true`) cannot be used by `reference_field`.'
    },
    {
        metadataType: 'referenceField',
        schemaType: 'reference_field',
        settingsExample: {
            current_lookup_field_api_name: 'lookup_835c2a2457b',
            target_reference_field_api_name: '_lark_user_id'
        },
        dependsOn: [
            'A single-value lookup field must exist first in the same object',
            'The target field must exist in the lookup target object'
        ],
        notes: 'Guide field must be single lookup (`multiple: false`).'
    },
    {
        metadataType: 'file',
        schemaType: 'attachment',
        settingsExample: {
            required: false,
            any_type: true,
            max_uploaded_num: 10,
            mime_types: []
        },
        notes: 'Do not send create type as `file`.'
    },
    {
        metadataType: 'autoId',
        schemaType: 'auto_number',
        settingsExample: {
            generation_method: 'random',
            digits: 1,
            prefix: '',
            suffix: '',
            start_at: '1'
        },
        notes: 'Do not send create type as `autoId`.'
    },
    {
        metadataType: 'richText',
        schemaType: 'richText',
        settingsExample: {
            required: false,
            max_length: 1000
        }
    },
    {
        metadataType: 'mobileNumber',
        schemaType: 'phone',
        settingsExample: {
            required: false,
            unique: false
        },
        notes: 'Do not send create type as `mobileNumber`.'
    },
    {
        metadataType: 'avatarOrLogo',
        schemaType: 'avatar',
        settingsExample: {
            display_style: 'square'
        },
        notes: 'Do not send create type as `avatarOrLogo`.'
    },
    {
        metadataType: 'email',
        schemaType: 'email',
        settingsExample: {
            required: false,
            unique: false
        }
    },
    {
        metadataType: 'region',
        schemaType: 'region',
        settingsExample: {
            required: false,
            multiple: false,
            has_level_strict: true,
            strict_level: 4
        }
    },
    {
        metadataType: 'decimal',
        schemaType: 'decimal',
        settingsExample: {
            required: false,
            unique: false,
            display_as_percentage: false,
            decimal_places: 2
        }
    },
    {
        metadataType: 'multilingual',
        schemaType: 'multilingual',
        settingsExample: {
            required: false,
            unique: false,
            case_sensitive: false,
            multiline: false,
            max_length: 1000
        }
    }
];

export const SCHEMA_TYPE_MISMATCHES: Array<{
    metadataType: MetadataFieldType;
    schemaType: SchemaFieldType;
}> = FIELD_SCHEMA_RULES
    .filter((rule) => rule.metadataType !== rule.schemaType)
    .map((rule) => ({
        metadataType: rule.metadataType,
        schemaType: rule.schemaType
    }));

// ── SQL → aPaaS 转换规则 ─────────────────────────────────

export interface SqlTypeMapping {
    /** SQL 类型的正则匹配模式（不区分大小写） */
    sqlPattern: string;
    /** 映射到的 aPaaS schema type */
    schemaType: SchemaFieldType;
    /** 从 SQL 类型提取 settings 的逻辑说明 */
    settingsMapping: string;
}

export const SQL_TYPE_TO_SCHEMA_TYPE: SqlTypeMapping[] = [
    { sqlPattern: 'VARCHAR\\(\\d+\\)|CHAR\\(\\d+\\)', schemaType: 'text', settingsMapping: 'max_length from (n), multiline: false' },
    { sqlPattern: 'TEXT|LONGTEXT|MEDIUMTEXT|TINYTEXT|CLOB', schemaType: 'text', settingsMapping: 'multiline: true, max_length: 100000' },
    { sqlPattern: 'INT|INTEGER|BIGINT|SMALLINT|TINYINT(?!\\(1\\))|MEDIUMINT|SERIAL', schemaType: 'bigint', settingsMapping: 'required/unique from constraints' },
    { sqlPattern: 'FLOAT|DOUBLE|REAL', schemaType: 'float', settingsMapping: 'decimal_places_number: 2' },
    { sqlPattern: 'DECIMAL\\(\\d+,\\d+\\)|NUMERIC\\(\\d+,\\d+\\)', schemaType: 'decimal', settingsMapping: 'decimal_places from scale (s)' },
    { sqlPattern: 'DATE', schemaType: 'date', settingsMapping: 'required from constraints' },
    { sqlPattern: 'DATETIME|TIMESTAMP', schemaType: 'datetime', settingsMapping: 'required from constraints' },
    { sqlPattern: 'BOOLEAN|BOOL|TINYINT\\(1\\)|BIT', schemaType: 'boolean', settingsMapping: 'default_value from DEFAULT' },
    { sqlPattern: 'ENUM\\(.*\\)', schemaType: 'enum', settingsMapping: 'options from enum values, colors auto-assigned' },
    { sqlPattern: 'BLOB|BINARY|VARBINARY|LONGBLOB|MEDIUMBLOB', schemaType: 'attachment', settingsMapping: 'any_type: true' },
    { sqlPattern: 'JSON', schemaType: 'richText', settingsMapping: 'only when JSON stores rich text content' }
];

export interface ColumnNameSemanticRule {
    /** 列名匹配模式（正则，不区分大小写） */
    columnPattern: string;
    /** 推断的 aPaaS schema type（优先级高于 SQL 类型映射） */
    schemaType: SchemaFieldType;
    /** 推断说明 */
    notes: string;
}

export const COLUMN_NAME_SEMANTIC_RULES: ColumnNameSemanticRule[] = [
    { columnPattern: '(^|_)(e?mail)(s?$|_)', schemaType: 'email', notes: 'Column name contains email/mail' },
    { columnPattern: '(^|_)(phone|mobile|tel)(s?$|_)', schemaType: 'phone', notes: 'Column name contains phone/mobile/tel' },
    { columnPattern: '(^|_)(avatar|logo|profile_image)(s?$|_)', schemaType: 'avatar', notes: 'Column name contains avatar/logo' },
    { columnPattern: '(^|_)(region|province|city|district|address)(s?$|_)', schemaType: 'region', notes: 'Column name implies geographic data' }
];

export interface SqlConstraintMapping {
    /** SQL 约束 */
    sqlConstraint: string;
    /** 对应的 aPaaS settings 字段 */
    settingsField: string;
    /** 映射值 */
    settingsValue: string;
    /** 说明 */
    notes: string;
}

export const SQL_CONSTRAINT_TO_SETTINGS: SqlConstraintMapping[] = [
    { sqlConstraint: 'NOT NULL', settingsField: 'required', settingsValue: 'true', notes: 'Maps to required: true' },
    { sqlConstraint: 'UNIQUE', settingsField: 'unique', settingsValue: 'true', notes: 'Maps to unique: true' },
    { sqlConstraint: 'PRIMARY KEY', settingsField: '-', settingsValue: '-', notes: 'Ignored: aPaaS uses system _id' },
    { sqlConstraint: 'AUTO_INCREMENT', settingsField: '-', settingsValue: '-', notes: 'Ignored: aPaaS _id auto-increments. For business serial numbers, use auto_number' },
    { sqlConstraint: 'FOREIGN KEY', settingsField: 'referenced_object_api_name', settingsValue: '(target table)', notes: 'Convert to lookup field' },
    { sqlConstraint: 'DEFAULT', settingsField: 'default_value', settingsValue: '(value)', notes: 'Only boolean type supports default_value in aPaaS' },
    { sqlConstraint: 'CHECK', settingsField: '-', settingsValue: '-', notes: 'Not supported in aPaaS, handle in application logic' },
    { sqlConstraint: 'INDEX', settingsField: '-', settingsValue: '-', notes: 'Not applicable, aPaaS manages indexing automatically' }
];

export const BATCH_UPDATE_REQUIREMENTS = {
    add: 'Use operator=add with full field definition.',
    replace: 'Use operator=replace and include full `type` (name + settings). Label-only replace fails.',
    remove: 'Use operator=remove with api_name only.',
    dependencyOrder: {
        add: ['lookup/lookup_multi before reference_field'],
        remove: ['reference_field before lookup/lookup_multi']
    },
    referenceFieldConstraint: 'reference_field only works with single lookup (`multiple: false`).'
} as const;
