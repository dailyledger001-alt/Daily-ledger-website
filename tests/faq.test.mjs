import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('src/assets/js/site.js', 'utf8');
const logic = source.slice(source.indexOf('const faqButtons'), source.indexOf('const prompts'));
function setup(reducedMotion = false) {
  const animations = [];
  const answers = Array.from({ length: 3 }, () => ({
    hidden: true, inert: false, scrollHeight: 120,
    getBoundingClientRect: () => ({ height: 120 }),
    animate(frames, timing) {
      const animation = { frames, timing, cancelled: false, cancel() { this.cancelled = true; }, finish() { if (!this.cancelled) this.onfinish(); } };
      animations.push(animation);
      return animation;
    }
  }));
  const buttons = answers.map((answer, i) => ({
    attributes: { 'aria-expanded': 'false', 'aria-controls': String(i) },
    getAttribute(key) { return this.attributes[key]; },
    setAttribute(key, value) { this.attributes[key] = value; },
    addEventListener(type, callback) { this.click = callback; }
  }));
  vm.runInNewContext(logic, {
    document: { querySelectorAll: () => buttons, getElementById: id => answers[Number(id)] },
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    getComputedStyle: () => ({ opacity: '1', paddingBottom: '24px' })
  });
  return { buttons, answers, animations, finish: () => animations.forEach(a => a.finish()) };
}
const test = setup();
test.buttons[0].click();
assert.equal(test.buttons[0].getAttribute('aria-expanded'), 'true');
assert.equal(test.answers[0].hidden, false);
test.finish();
test.buttons[1].click();
assert.equal(test.buttons[0].getAttribute('aria-expanded'), 'false');
assert.equal(test.answers[0].hidden, false, 'Previous answer remains visible while closing');
assert.equal(test.answers[0].inert, true, 'Closing answer cannot receive keyboard focus');
assert.equal(test.animations.at(-2).frames[1].height, '0px');
assert.equal(test.animations.at(-1).timing.duration, 320);
test.finish();
assert.equal(test.answers[0].hidden, true);
assert.equal(test.answers[1].hidden, false);
test.buttons[1].click();
test.finish();
assert.equal(test.answers[1].hidden, true, 'Clicking the open question closes it');
test.buttons[0].click();
test.buttons[1].click();
test.buttons[0].click();
test.finish();
assert.deepEqual(test.answers.map(a => a.hidden), [false, true, true], 'Rapid clicks preserve the latest selection');
assert.equal(test.buttons.filter(b => b.getAttribute('aria-expanded') === 'true').length, 1);
const reduced = setup(true);
reduced.buttons[0].click();
reduced.buttons[2].click();
assert.deepEqual(reduced.answers.map(a => a.hidden), [true, true, false]);
assert.equal(reduced.animations.length, 0, 'Reduced motion skips the animation');
console.log('FAQ checks passed: exclusive opening, smooth closing, rapid clicks, collapse and reduced motion.');
