import { expect, test } from 'bun:test';
import plugin from './index';

test('plugin exposes config and event hook surfaces', async () => {
  const registration = await plugin.server({
    directory: process.cwd(),
  } as never);
  const hasOwn = Object.hasOwn.bind(Object);

  expect(hasOwn(registration, 'config')).toBe(true);
  expect(hasOwn(registration, 'event')).toBe(true);
  expect(hasOwn(registration, 'tool')).toBe(true);
  expect(hasOwn(registration, 'experimental.chat.system.transform')).toBe(true);
  expect(hasOwn(registration, 'experimental.chat.messages.transform')).toBe(
    true,
  );
  expect(Object.keys(registration.tool ?? {}).sort()).toEqual([
    'ast_grep_replace',
    'ast_grep_search',
    'auto_continue',
    'cancel_task',
    'read_session',
    'subtask',
    'webfetch',
  ]);
});
