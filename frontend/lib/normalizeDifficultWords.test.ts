import { describe, expect, it } from 'vitest';
import { normalizeDifficultWords } from './normalizeDifficultWords';

describe('normalizeDifficultWords', () => {
  it('null と undefined は空配列', () => {
    expect(normalizeDifficultWords(null)).toEqual([]);
    expect(normalizeDifficultWords(undefined)).toEqual([]);
  });

  it('配列でない値は空配列', () => {
    expect(normalizeDifficultWords({})).toEqual([]);
    expect(normalizeDifficultWords(123)).toEqual([]);
    expect(normalizeDifficultWords('not json')).toEqual([]);
  });

  it('JSON 文字列が不正なら空配列', () => {
    expect(normalizeDifficultWords('{broken')).toEqual([]);
  });

  it('JSON 文字列が配列でなければ空配列', () => {
    expect(normalizeDifficultWords('{"a":1}')).toEqual([]);
  });

  it('JSON 文字列から配列をパースできる', () => {
    const json = JSON.stringify([
      { term: ' 用語A ', description: '説明A' },
      { term: '用語B', body: '本文B' },
    ]);
    expect(normalizeDifficultWords(json)).toEqual([
      { term: '用語A', description: '説明A' },
      { term: '用語B', description: '本文B' },
    ]);
  });

  it('配列をそのまま受け取れる', () => {
    expect(
      normalizeDifficultWords([
        { term: 'x', description: 'd' },
        null,
        1,
        { term: '', description: '無視' },
        { notTerm: 'a' },
        { term: 'y', description: 99, body: 'fallback' },
      ]),
    ).toEqual([
      { term: 'x', description: 'd' },
      { term: 'y', description: 'fallback' },
    ]);
  });

  it('description が無く body のみなら body を使う', () => {
    expect(normalizeDifficultWords([{ term: 't', body: 'b' }])).toEqual([
      { term: 't', description: 'b' },
    ]);
  });

  it('description が文字列でない場合は body を検討し、どちらも無ければ空文字', () => {
    expect(normalizeDifficultWords([{ term: 't', description: 1 }])).toEqual([
      { term: 't', description: '' },
    ]);
  });
});
