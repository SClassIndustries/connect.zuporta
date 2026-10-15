import test from 'node:test';
import assert from 'node:assert/strict';
import { route, respondToText, respondToAction } from '../connect.zuporta.com/assets/js/assistant.js';

test('explicit crisis expressions interrupt guided activities and human matching', () => {
  for (const text of ['I want to end my life', 'I don’t want to live', 'I want to end it all', 'I cannot keep myself safe', 'I need a coach because I want to hurt myself', 'I am thinking about self–harm']) {
    const session = { step: 'talking', topic: 'work' };
    assert.equal(route(text).lane, 'crisis', text);
    const blocks = respondToText(text, session);
    assert(blocks.some((block) => block.t === 'crisis'), text);
    assert(!blocks.some((block) => block.t === 'matching' || block.t === 'activity'), text);
    assert.equal(session.step, 'open');
  }
});
test('medical, safety and legal questions stay outside the wellness-advice lane', () => {
  assert.deepEqual(route('Can a coach prescribe my medication dosage?'), { lane: 'scope', kind: 'medical' });
  assert.equal(route('I am unsafe at home').kind, 'harm');
  assert.equal(route('I need legal advice for a court case').kind, 'legal');
  assert.equal(route('I want to talk to a real person about my job').lane, 'human');
  assert.equal(route('I am stressed by a deadline at work').lane, 'wellness');
});
test('guided support stores the chosen before score and awaits a user-rated after result', () => {
  const session = { step: 'understand', topic: 'stress' };
  respondToAction('path:reset', null, session);
  assert.equal(session.step, 'checkin');
  respondToAction('checkin', 7, session);
  assert.equal(session.before, 7);
  assert.equal(session.after, undefined);
  assert.equal(session.step, 'context');
});
