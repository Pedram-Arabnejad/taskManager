import { InvalidEmailError } from '../../../src/domain/errors/domain-errors';
import { Email } from '../../../src/domain/value-objects/email';

describe('Email', () => {
  it('should trim and lowercase the address when it is valid', () => {
    const email = Email.create('  Ali.Rezaei@Example.COM ');

    expect(email.value).toBe('ali.rezaei@example.com');
    expect(email.toString()).toBe('ali.rezaei@example.com');
  });

  it('should treat addresses that only differ in case as equal', () => {
    expect(Email.create('ALI@example.com').equals(Email.create('ali@example.com'))).toBe(true);
  });

  it('should reject an empty address when created', () => {
    expect(() => Email.create('   ')).toThrow(InvalidEmailError);
  });

  it('should reject an address without a domain suffix when created', () => {
    expect(() => Email.create('ali@example')).toThrow(InvalidEmailError);
  });

  it('should reject an address with whitespace inside when created', () => {
    expect(() => Email.create('ali rezaei@example.com')).toThrow(InvalidEmailError);
  });

  it('should reject an address longer than 254 characters when created', () => {
    const tooLong = `${'a'.repeat(250)}@example.com`;

    expect(() => Email.create(tooLong)).toThrow(InvalidEmailError);
  });
});
