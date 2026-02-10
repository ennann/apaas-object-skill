---
name: apaas-object-skill
description: Use when creating, updating, or deleting aPaaS data objects (schemas/tables), managing field definitions, or troubleshooting schema API errors like type mismatches, missing fields, or dependency ordering issues.
---

# aPaaS 数据对象管理

管理 aPaaS 平台数据对象（表）的创建、更新、删除。通过 Node SDK 的 `client.schema.*` 接口操作。

## 前置条件

使用此 skill 前，必须确保以下环境已就绪：

1. **安装 Node.js**（>= 16）
2. **安装 SDK**：`npm install apaas-oapi-client`
3. **获取凭据**（在 aPaaS 平台的应用管理中获取）：
   - Client ID（格式：`c_` 开头，如 `c_a4dd955086ec45a882b9`）
   - Client Secret（格式：32 位十六进制，如 `a62fc785b97a4847810a4f319ccbdb5e`）
   - Namespace（必须以 `__c` 结尾，如 `package_5dc5b7__c`）

## 系统预置规则

### 系统预置对象（只读）

平台预置两张数据表，**不可修改、不可删除**：

| 对象 | 说明 |
|------|------|
| `_user` | 用户表 |
| `_department` | 部门表 |

### 系统字段识别规则

**API name 以 `_` 下划线开头的对象或字段，均为系统预置，只读不可修改/删除。**

### 默认字段

任何新建的空白对象，系统自动生成以下 5 个字段，无需手动创建：

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | bigint | 记录唯一标识 |
| `_createdBy` | lookup | 创建人 |
| `_createdAt` | datetime | 创建时间 |
| `_updatedBy` | lookup | 最后修改人 |
| `_updatedAt` | datetime | 最后修改时间 |

**注意**：
- 不要在 `schema.create` 的 fields 中定义这些字段，会冲突报错
- 不要尝试用 `schema.update` 修改或删除这些字段
- `_user` 和 `_department` 可以作为 lookup 的 `referenced_object_api_name` 目标（如关联用户/部门）

## 核心 API

| 接口 | 用途 |
|------|------|
| `client.schema.create({ objects })` | 批量创建数据对象 |
| `client.schema.update({ objects })` | 批量更新对象（添加/修改/删除字段） |
| `client.schema.delete({ api_names })` | 批量删除数据对象 |
| `client.object.listWithIterator()` | 列出所有数据对象 |
| `client.object.metadata.fields({ object_name })` | 获取对象所有字段元数据 |
| `client.object.metadata.export2markdown()` | 导出对象元数据为 Markdown |

## 创建对象

```typescript
await client.schema.create({
    objects: [{
        api_name: 'product',
        label: { zh_cn: '产品', en_us: 'Product' },
        settings: {
            display_name: 'name',           // 展示名称字段（不能用 _name）
            allow_search_fields: ['_id', 'code', 'name'],  // 不能包含 _name
            search_layout: ['code', 'name']
        },
        fields: [
            {
                api_name: 'code',
                label: { zh_cn: '产品编号', en_us: 'Code' },
                type: {
                    name: 'text',       // 必须用 schema type，不是 metadata type
                    settings: { required: true, unique: true, case_sensitive: false, multiline: false, max_length: 50 }
                },
                encrypt_type: 'none'
            }
        ]
    }]
});
```

## 更新对象

三种操作通过 `operator` 字段区分：

```typescript
await client.schema.update({
    objects: [{
        api_name: 'product',
        fields: [
            // 添加字段
            { operator: 'add', api_name: 'desc', label: { zh_cn: '描述', en_us: 'Desc' },
              type: { name: 'text', settings: { multiline: true, max_length: 1000 } }, encrypt_type: 'none' },
            // 修改字段（必须带完整 type，只改 label 会报错）
            { operator: 'replace', api_name: 'code',
              label: { zh_cn: '编号', en_us: 'Code' },
              type: { name: 'text', settings: { required: true, unique: true, max_length: 100 } } },
            // 删除字段（只需 api_name）
            { operator: 'remove', api_name: 'desc' }
        ]
    }]
});
```

## 删除对象

```typescript
await client.schema.delete({ api_names: ['product', 'order'] });
```

## 字段类型映射（关键陷阱）

metadata 返回的类型名和 schema 接口接受的类型名**不一致**，必须转换：

| Metadata Type | Schema Type | 注意 |
|---|---|---|
| `text` | `text` | `multiline: false` 单行，`true` 多行 |
| `number` | `float` | **不能**用 `number` |
| `option` | `enum` | **不能**用 `option` |
| `file` | `attachment` | **不能**用 `file` |
| `autoId` | `auto_number` | **不能**用 `autoId` |
| `mobileNumber` | `phone` | **不能**用 `mobileNumber` |
| `avatarOrLogo` | `avatar` | **不能**用 `avatarOrLogo` |
| `referenceField` | `reference_field` | 依赖 lookup |
| `bigint` | `bigint` | 同名 |
| `date` / `datetime` | `date` / `datetime` | 同名 |
| `boolean` | `boolean` | 同名 |
| `lookup` | `lookup` | `multiple: false` 单值，`true` 多值 |
| `richText` | `richText` | 同名 |
| `email` | `email` | 同名 |
| `region` | `region` | 同名 |
| `decimal` | `decimal` | 同名 |
| `multilingual` | `multilingual` | 同名 |

**机器可读映射源**：SDK 包中 `field-schema-rules.ts` 导出的 `SCHEMA_TYPE_BY_METADATA_TYPE` 和 `FIELD_SCHEMA_RULES`。

## 各字段类型 settings 速查

| Schema Type | 关键 settings |
|---|---|
| `text` | `required, unique, case_sensitive, multiline, max_length` |
| `float` | `required, unique, display_as_percentage, decimal_places_number` |
| `bigint` | `required, unique` |
| `date` / `datetime` | `required` |
| `enum` | `required, multiple, option_source("custom"), options[{label, api_name, color, active}]` |
| `boolean` | `default_value, description_if_true{zh_cn,en_us}, description_if_false{zh_cn,en_us}` |
| `lookup` | `required, multiple, referenced_object_api_name, display_as_tree, display_style` |
| `reference_field` | `current_lookup_field_api_name, target_reference_field_api_name` |
| `attachment` | `required, any_type, max_uploaded_num, mime_types[]` |
| `auto_number` | `generation_method("random"), digits, prefix, suffix, start_at` |
| `richText` | `required, max_length` |
| `phone` | `required, unique` |
| `avatar` | `display_style("square")` |
| `email` | `required, unique` |
| `region` | `required, multiple, has_level_strict, strict_level` |
| `decimal` | `required, unique, display_as_percentage, decimal_places` |
| `multilingual` | `required, unique, case_sensitive, multiline, max_length` |

**enum 选项颜色**：`blue, cyan, green, yellow, orange, red, magenta, purple, blueMagenta, grey`

## 多对象依赖分析与分阶段创建（核心策略）

当一个应用有多张数据表且互相关联时，**不能一次性创建带 lookup 的完整对象**。

### 问题：循环依赖

```
订单(order) --lookup--> 客户(customer)
客户(customer) --lookup--> 订单(order)   // 互相引用，谁先创建？
```

lookup 字段要求目标对象已存在，互相引用时直接创建必然失败。

### 解决：三阶段创建法

**阶段 1 — 创建空壳对象**：所有对象只带基础字段（text, bigint, decimal, enum, date 等不依赖其他对象的字段），不带 lookup / reference_field。

```typescript
// 阶段 1：先创建所有对象的空壳
await client.schema.create({
    objects: [
        {
            api_name: 'customer',
            label: { zh_cn: '客户', en_us: 'Customer' },
            settings: { display_name: 'name', allow_search_fields: ['_id', 'name'], search_layout: ['name'] },
            fields: [
                { api_name: 'name', label: { zh_cn: '客户名', en_us: 'Name' },
                  type: { name: 'text', settings: { required: true, max_length: 200 } }, encrypt_type: 'none' }
            ]
        },
        {
            api_name: 'order',
            label: { zh_cn: '订单', en_us: 'Order' },
            settings: { display_name: 'order_no', allow_search_fields: ['_id', 'order_no'], search_layout: ['order_no'] },
            fields: [
                { api_name: 'order_no', label: { zh_cn: '订单号', en_us: 'Order No' },
                  type: { name: 'text', settings: { required: true, unique: true, max_length: 50 } }, encrypt_type: 'none' }
            ]
        }
    ]
});
```

**阶段 2 — 补充 lookup 字段**：所有对象已存在，用 `schema.update` + `operator: 'add'` 给每个对象补上 lookup 字段。

```typescript
// 阶段 2：所有对象已存在，补 lookup
await client.schema.update({
    objects: [
        {
            api_name: 'order',
            fields: [
                { operator: 'add', api_name: 'customer', label: { zh_cn: '客户', en_us: 'Customer' },
                  type: { name: 'lookup', settings: { required: false, multiple: false, referenced_object_api_name: 'customer' } },
                  encrypt_type: 'none' }
            ]
        },
        {
            api_name: 'customer',
            fields: [
                { operator: 'add', api_name: 'latest_order', label: { zh_cn: '最近订单', en_us: 'Latest Order' },
                  type: { name: 'lookup', settings: { required: false, multiple: false, referenced_object_api_name: 'order' } },
                  encrypt_type: 'none' }
            ]
        }
    ]
});
```

**阶段 3 — 补充 reference_field**：lookup 就位后，添加引用字段。

```typescript
// 阶段 3：lookup 就位后，补 reference_field
await client.schema.update({
    objects: [{
        api_name: 'order',
        fields: [
            { operator: 'add', api_name: 'customer_name', label: { zh_cn: '客户名称', en_us: 'Customer Name' },
              type: { name: 'reference_field', settings: {
                  current_lookup_field_api_name: 'customer',
                  target_reference_field_api_name: 'name'
              } }, encrypt_type: 'none' }
        ]
    }]
});
```

### 依赖分析流程

拿到需求后，按此流程分析：

1. **列出所有对象和字段**，标记哪些字段是 lookup / lookup_multi / reference_field
2. **画出依赖关系**：lookup 的 `referenced_object_api_name` 指向谁
3. **分类字段**：
   - 基础字段（text, bigint, float, date, datetime, enum, boolean, attachment, auto_number, richText, phone, avatar, email, region, decimal, multilingual）→ 阶段 1
   - lookup / lookup_multi → 阶段 2
   - reference_field → 阶段 3
4. **如果无循环依赖**（如 A→B→C 单向链），可以按拓扑序在阶段 1 直接带上 lookup，但**推荐始终用三阶段法**，更安全且一致

### 删除顺序（逆向）

删除时必须反向操作：

1. **先删 reference_field**（依赖 lookup）
2. **再删 lookup / lookup_multi**（依赖目标对象）
3. **最后删对象本身**

### 约束速记

- `reference_field` 只能引用 `multiple: false` 的 lookup
- `lookup_multi`（`multiple: true`）**不能**作为 reference_field 的引导字段
- 同一批 `schema.update` 中，add 的执行顺序不保证，不要在同一批里 add lookup 又 add 依赖它的 reference_field

## 常见错误与对策

| 错误 | 原因 | 修复 |
|---|---|---|
| `k_ec_000015 field type is required` | `replace` 时只传了 label 没传 type | replace 必须带完整 type（name + settings） |
| 创建字段类型不识别 | 用了 metadata type（如 `number`） | 用 schema type（`float`） |
| `display_name` 报错 | 使用了 `_name` | 改用自定义字段名如 `name` |
| lookup 创建失败 | 目标对象不存在 | 先创建目标对象 |
| reference_field 创建失败 | 引导 lookup 不存在或是 multi | 先创建 `multiple: false` 的 lookup |

## 响应验证

响应是**双层结构**：

```typescript
const result = await client.schema.create({ objects: [...] });

// 顶层 code="0" 只表示请求格式正确
if (result.code !== '0') { /* 请求级错误 */ }

// 真正的状态在 data.items 中
for (const item of result.data?.items || []) {
    if (item.status?.code !== '0') {
        console.error(`对象 ${item.api_name} 失败:`, item.status);
    }
}
```

## 创建后验证工作流

创建/更新对象后，建议验证：

```typescript
// 1. 列出对象，确认存在
const objects = await client.object.listWithIterator();
const found = objects.items.find(o => o.apiName === 'product');

// 2. 获取字段元数据，验证字段定义
const fields = await client.object.metadata.fields({ object_name: 'product' });

// 3. 导出 Markdown，便于人工审查
const md = await client.object.metadata.export2markdown({ object_names: ['product'] });
console.log(md);
```

## 执行脚本

`scripts/run.ts` 用于快速执行 schema 操作：

```bash
# 1. 安装依赖
npm install

# 2. 配置凭据（格式见"前置条件"）
cp scripts/.env.example scripts/.env
# 编辑 scripts/.env 填入真实值

# 3. 在 scripts/run.ts 的 main() 中编写操作，然后执行
npx ts-node scripts/run.ts
```

脚本自动从 `.env` 读取凭据、初始化 client、执行操作。内置 `verifyObjects()` 函数用于创建后验证。

## 目录结构

```
apaas-object-skill/
  SKILL.md                          # 主文档
  LICENSE.txt                       # ISC 协议
  references/
    FIELD_SCHEMA_RULES.md           # 字段类型映射、依赖规则、选项颜色、batch_update 规则
  scripts/
    run.ts                          # 执行脚本（凭据加载、client 初始化、验证工具）
    .env.example                    # 凭据配置模板
```

## 其他参考

- 字段规则 TypeScript 定义（机器可读源）：SDK 包中 `field-schema-rules.ts`
- SDK 仓库示例：`examples/schema-operations.ts`（基础 CRUD）、`examples/schema-reference-fields.ts`（关联字段）
