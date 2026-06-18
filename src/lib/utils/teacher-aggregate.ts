// 教師大廳跨學生資料彙整。
// Firebase 模式：讀取整個 `users` collection，把每位學生的資料合併。
// 本機模式：直接讀取 appStorage 對應的 key。
// 每個 key 的 JSON 結構皆為 { 學生名: { history, abandons, ... } }。

import { appStorage } from '$lib/utils/storage';

type StudentRecords = Record<string, any>;

function mergeStudentData(a: any, b: any): any {
  return {
    ...a,
    ...b,
    sessions: [...(a?.sessions ?? []), ...(b?.sessions ?? [])],
    history: [...(a?.history ?? []), ...(b?.history ?? [])],
    abandons: [...(a?.abandons ?? []), ...(b?.abandons ?? [])],
    progress: { ...(a?.progress ?? {}), ...(b?.progress ?? {}) }
  };
}

function ingest(target: Record<string, StudentRecords>, keys: string[], fields: Record<string, string>) {
  for (const key of keys) {
    const raw = fields[key];
    if (!raw) continue;
    let parsed: StudentRecords;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    for (const [student, data] of Object.entries(parsed)) {
      target[key][student] = target[key][student]
        ? mergeStudentData(target[key][student], data)
        : data;
    }
  }
}

/**
 * 彙整指定的多個 storage key，跨所有學生合併。
 * @returns { key: { 學生名: 資料 } }
 */
export async function aggregateAcrossUsers(keys: string[]): Promise<Record<string, StudentRecords>> {
  const result: Record<string, StudentRecords> = {};
  for (const key of keys) result[key] = {};

  const users = await appStorage.fetchAllUsers();
  if (Object.keys(users).length > 0) {
    for (const fields of Object.values(users)) ingest(result, keys, fields);
  } else {
    // 本機模式 fallback：直接讀 appStorage
    const fields: Record<string, string> = {};
    for (const key of keys) {
      const v = appStorage.getItem(key);
      if (v) fields[key] = v;
    }
    ingest(result, keys, fields);
  }
  return result;
}
