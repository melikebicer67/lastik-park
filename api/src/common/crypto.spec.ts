import { decrypt, encrypt } from './crypto.js';

describe('crypto', () => {
  it('şifrelenen metni geri çözer', () => {
    const secret = 'test-secret';
    const payload = encrypt('Gizli.Şifre123', secret);
    expect(payload).not.toContain('Gizli');
    expect(decrypt(payload, secret)).toBe('Gizli.Şifre123');
  });

  it('yanlış anahtarla çözmeyi reddeder', () => {
    const payload = encrypt('abc', 'a');
    expect(() => decrypt(payload, 'b')).toThrow();
  });
});
