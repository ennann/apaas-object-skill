/**
 * aPaaS Schema 操作执行脚本
 *
 * 用法：
 *   npx ts-node apaas-object-skill/scripts/run.ts
 *
 * 前置条件：
 *   1. 复制 .env.example 为 .env 并填入凭据
 *   2. 或者设置环境变量 APAAS_CLIENT_ID / APAAS_CLIENT_SECRET / APAAS_NAMESPACE
 *
 * 使用方式：
 *   在下方 main() 函数中编写 schema 操作代码，然后执行此脚本。
 */

import * as fs from 'fs';
import * as path from 'path';
import { apaas } from 'apaas-oapi-client';

// ── 加载 .env ──────────────────────────────────────────────
function loadEnv() {
    const envPath = path.resolve(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.warn('[warn] .env 文件不存在，将使用环境变量');
        return;
    }
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadEnv();

// ── 校验凭据 ───────────────────────────────────────────────
const clientId = process.env.APAAS_CLIENT_ID;
const clientSecret = process.env.APAAS_CLIENT_SECRET;
const namespace = process.env.APAAS_NAMESPACE;

if (!clientId || !clientSecret || !namespace) {
    console.error('缺少凭据。请配置 .env 文件或设置环境变量：');
    console.error('  APAAS_CLIENT_ID      (格式: c_xxxx)');
    console.error('  APAAS_CLIENT_SECRET   (格式: 32位hex)');
    console.error('  APAAS_NAMESPACE       (格式: package_xxx__c)');
    process.exit(1);
}

if (!namespace.endsWith('__c')) {
    console.error(`Namespace "${namespace}" 不以 __c 结尾，请检查。`);
    process.exit(1);
}

// ── 初始化 Client ──────────────────────────────────────────
const client = new apaas.Client({
    clientId,
    clientSecret,
    namespace
});

// ── 响应验证（三层检查） ──────────────────────────────────
function checkResponse(result: any, context: string): boolean {
    // 第 1 层：请求级错误
    if (result.code !== '0') {
        console.error(`[FAIL] ${context}: 请求失败 code=${result.code}, msg=${result.msg}`);
        return false;
    }
    // 第 2 层：静默失败（最危险）
    if (result.code === '0' && result.data === null) {
        console.error(`[FAIL] ${context}: 静默失败 — code=0 但 data=null。检查字段 settings 是否完整（text 必须有 multiline，auto_number 必须有 generation_method）`);
        return false;
    }
    // 第 3 层：逐项检查
    let allOk = true;
    for (const item of result.data?.items || []) {
        if (item.status?.code && item.status.code !== '0') {
            console.error(`[FAIL] ${context}: 对象 ${item.api_name} 失败 — ${item.status.message}`);
            allOk = false;
        }
    }
    if (allOk) {
        console.log(`[OK] ${context}`);
    }
    return allOk;
}

// ── 批量拆分执行（每批最多 10 个对象） ─────────────────────
async function batchExecute<T>(
    items: T[],
    batchSize: number,
    fn: (batch: T[]) => Promise<any>,
    context: string
): Promise<boolean> {
    let allOk = true;
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(items.length / batchSize);
        const label = `${context} [批次 ${batchNum}/${totalBatches}]`;
        const result = await fn(batch);
        if (!checkResponse(result, label)) {
            allOk = false;
        }
    }
    return allOk;
}

// ── 验证对象及字段 ────────────────────────────────────────
async function verifyObjects(objectNames: string[]) {
    console.log('\n── 验证对象 ──');

    const allObjects = await client.object.listWithIterator();
    for (const name of objectNames) {
        const found = allObjects.items?.find((o: any) => o.apiName === name);
        if (!found) {
            console.log(`  [!!] ${name} 不存在`);
            continue;
        }
        // 检查字段数量
        const fieldResult = await client.object.metadata.fields({ object_name: name });
        const fields = fieldResult.data?.fields || [];
        const customFields = fields.filter((f: any) => !f.apiName.startsWith('_'));
        console.log(`  [OK] ${name} 存在（${customFields.length} 个自定义字段）`);
        for (const f of customFields) {
            const typeName = f.type?.name || f.type || '?';
            console.log(`       - ${f.apiName} (${typeName})`);
        }
    }

    // 导出 Markdown
    const md = await client.object.metadata.export2markdown({ object_names: objectNames });
    console.log('\n── 对象元数据 ──\n');
    console.log(md);
}

// ── 主函数（在此编写 schema 操作）─────────────────────────
async function main() {
    await client.init();
    console.log(`已连接: namespace=${namespace}\n`);

    // ═══════════════════════════════════════════════════════
    // 在下方编写你的 schema 操作
    // ═══════════════════════════════════════════════════════

    // 示例：列出当前所有对象
    const objects = await client.object.listWithIterator();
    console.log(`当前共 ${objects.items?.length ?? 0} 个对象：`);
    for (const obj of objects.items || []) {
        console.log(`  - ${obj.apiName} (${obj.label?.zh_cn || obj.label?.en_us || ''})`);
    }

    // ═══════════════════════════════════════════════════════
    // 操作完成后，取消注释以下行进行验证
    // await verifyObjects(['your_object_name']);
    // ═══════════════════════════════════════════════════════
}

main().catch(err => {
    console.error('执行失败:', err.message || err);
    process.exit(1);
});

export { client, checkResponse, batchExecute, verifyObjects };
