import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesOwner } from './owner.js';
test('owner identity fails closed when configuration or session is missing', () => {
  assert.equal(matchesOwner(null, undefined), false);
  assert.equal(matchesOwner({}, undefined), false);
  assert.equal(matchesOwner({ user: {} }, undefined), false);
  assert.equal(matchesOwner(null, 'owner'), false);
  assert.equal(matchesOwner({ user: { id: 'stranger' } }, 'owner'), false);
  assert.equal(matchesOwner({ user: { id: 'owner' } }, 'owner'), true);
});
