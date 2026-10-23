import { randomUUID } from 'expo-crypto';

import { getDb } from './client';
import { CategoryRepository } from './repositories/CategoryRepository';
import { PaymentMethodRepository } from './repositories/PaymentMethodRepository';
import { PaymentRepository } from './repositories/PaymentRepository';
import { SettingsRepository } from './repositories/SettingsRepository';
import { SqliteSubscriptionRepository } from './repositories/SqliteSubscriptionRepository';

export type Repositories = {
  subscriptions: SqliteSubscriptionRepository;
  categories: CategoryRepository;
  paymentMethods: PaymentMethodRepository;
  payments: PaymentRepository;
  settings: SettingsRepository;
};

let repositories: Repositories | null = null;

/** DB を開き（マイグレーション込み）、各 Repository を用意する */
export async function initRepositories(): Promise<Repositories> {
  if (repositories) return repositories;
  const db = await getDb();
  const generateId = () => randomUUID();
  repositories = {
    subscriptions: new SqliteSubscriptionRepository(db, { generateId }),
    categories: new CategoryRepository(db, generateId),
    paymentMethods: new PaymentMethodRepository(db, generateId),
    payments: new PaymentRepository(db, generateId),
    settings: new SettingsRepository(db),
  };
  return repositories;
}

export function getRepositories(): Repositories {
  if (!repositories) throw new Error('initRepositories() が完了する前に呼ばれました');
  return repositories;
}
