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

// ── 验证工具函数 ──────────────────────────────────────────
async function verifyObjects(objectNames: string[]) {
    console.log('\n── 验证对象 ──');

    // 列出所有对象
    const allObjects = await client.object.listWithIterator();
    for (const name of objectNames) {
        const found = allObjects.items?.find((o: any) => o.apiName === name);
        if (found) {
            console.log(`  [OK] ${name} 存在`);
        } else {
            console.log(`  [!!] ${name} 不存在`);
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

export { client, verifyObjects };
