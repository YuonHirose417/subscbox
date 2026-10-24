import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { Subscription } from '@/domain/types';
import { logger } from '@/utils/logger';

/** 保存する画像の一辺（px）。アイコン表示には十分で、容量を抑えられる */
const ICON_SIZE = 512;

/** カスタムアイコン画像の保存先（アプリの書類フォルダ内）。DB には 'icons/<id>.jpg' の相対パスを保存する */
const ICON_DIR = 'icons';

function iconDirectory(): Directory {
  return new Directory(Paths.document, ICON_DIR);
}

/** 相対パス → 表示用の URI（ファイルが無ければ null。復元したバックアップには画像が含まれないため） */
export function iconImageUri(relativePath: string): string | null {
  try {
    const file = new File(Paths.document, relativePath);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/** 写真を選び、正方形に切り抜いて 512px に縮小した JPEG をアプリ内に保存する。キャンセルなら null */
export async function pickIconImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const { uri, width, height } = result.assets[0];

  // 編集画面で正方形にならなかった場合に備えて中央を切り抜く
  const side = Math.min(width, height);
  const context = ImageManipulator.manipulate(uri);
  if (width !== height) {
    context.crop({
      originX: Math.floor((width - side) / 2),
      originY: Math.floor((height - side) / 2),
      width: side,
      height: side,
    });
  }
  context.resize({ width: ICON_SIZE, height: ICON_SIZE });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  context.release();
  image.release();

  const dir = iconDirectory();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const name = `${randomUUID()}.jpg`;
  const temp = new File(saved.uri);
  await temp.move(new File(dir, name));
  return `${ICON_DIR}/${name}`;
}

/** どのサブスクからも使われていない画像を消す（差し替え・削除・キャンセルで残ったもの） */
export function removeUnusedIconImages(subs: readonly Subscription[]): void {
  try {
    const dir = iconDirectory();
    if (!dir.exists) return;
    const used = new Set(
      subs.filter((s) => s.icon.type === 'image').map((s) => s.icon.value?.split('/').pop()),
    );
    for (const entry of dir.list()) {
      if (entry instanceof File && !used.has(entry.name)) entry.delete();
    }
  } catch (error) {
    logger.error('failed to clean up icon images', error);
  }
}
