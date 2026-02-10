# apaas-object-skill

aPaaS 数据对象管理 Skill，用于 [Claude Code](https://claude.ai/claude-code)。

帮助 Claude 正确地创建、更新、删除 aPaaS 平台的数据对象（表），自动处理字段类型映射、多对象依赖分析、分阶段创建等复杂逻辑。

## 功能

- 通过 `client.schema.create / update / delete` 管理数据对象
- 20 种字段类型的完整 settings 参考和类型映射规则
- 多对象循环依赖的三阶段创建策略（空壳 → lookup → reference_field）
- 系统预置对象和默认字段的识别规则
- 创建后自动验证工作流

## 前置条件

- Node.js >= 16
- aPaaS Node SDK：`npm install apaas-oapi-client`
- aPaaS 平台凭据（Client ID、Client Secret、Namespace）

## 安装

```bash
# 方式 1：通过 npx skills add
npx skills add ennann/apaas-object-skill

# 方式 2：手动安装到全局 skills
git clone https://github.com/ennann/apaas-object-skill.git ~/.claude/skills/apaas-object-skill

# 方式 3：安装到项目级
git clone https://github.com/ennann/apaas-object-skill.git .claude/skills/apaas-object-skill
```

## 快速开始

### 1. 初始化 Client

```typescript
import { apaas } from 'apaas-oapi-client';

const client = new apaas.Client({
    clientId: 'c_a4dd955086ec45a882b9',
    clientSecret: 'a62fc785b97a4847810a4f319ccbdb5e',
    namespace: 'package_5dc5b7__c'
});
await client.init();
```

### 2. 创建数据对象

```typescript
await client.schema.create({
    objects: [{
        api_name: 'product',
        label: { zh_cn: '产品', en_us: 'Product' },
        settings: { display_name: 'name', allow_search_fields: ['_id', 'name'], search_layout: ['name'] },
        fields: [
            { api_name: 'name', label: { zh_cn: '名称', en_us: 'Name' },
              type: { name: 'text', settings: { required: true, max_length: 200 } },
              encrypt_type: 'none' }
        ]
    }]
});
```

### 3. 使用执行脚本

```bash
cd apaas-object-skill
npm install
cp scripts/.env.example scripts/.env
# 编辑 scripts/.env 填入凭据
npx ts-node scripts/run.ts
```

## 目录结构

```
apaas-object-skill/
  SKILL.md                  # Skill 主文档（Claude 读取此文件）
  LICENSE.txt               # ISC 协议
  package.json              # 依赖声明
  references/
    FIELD_SCHEMA_RULES.md   # 字段类型映射和规则参考
  scripts/
    run.ts                  # 执行脚本（含 client 初始化和验证工具）
    .env.example            # 凭据配置模板
```

## 关键注意事项

- **字段类型映射**：metadata 返回的类型名和 schema 接口接受的不一致（如 `number` 要用 `float`，`option` 要用 `enum`），详见 SKILL.md
- **系统对象只读**：`_user`、`_department` 以及所有 `_` 开头的字段不可修改/删除
- **循环依赖处理**：多对象互相 lookup 时，需分三阶段创建（空壳 → 补 lookup → 补 reference_field）
- **响应双层结构**：顶层 `code="0"` 仅表示请求格式正确，实际结果在 `data.items[].status` 中

## 依赖

- [apaas-oapi-client](https://www.npmjs.com/package/apaas-oapi-client) - aPaaS Node SDK

## 协议

[ISC](LICENSE.txt)
