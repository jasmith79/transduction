/*
 * trarsduction.js
 * @author jasmith79
 * @license MIT
 * @copyright Jared Adam Smith, 2017
 *
 * Simple implementation of Transducers in JavaScript. Not meant to conform to the 
 * Cognitect transducer protocol although obviously inspired by the clojure
 * implementation.
 */

const NON_ITER = new TypeError(`Collection argument to transducer is not iterable`);
const NO_SYMBOL = new Error('Transducer attempted to access Symbol.iterator but it does not exist');
const global = (new Function('return this'))();
let Symbol = global.Symbol;

if (typeof Symbol === 'undefined' || typeof Symbol.iterator === 'undefined') {
  console.warn('Symbol and generator support not detected. ' +
    'Please use an appropriate polyfill, or transduction will throw on iterable.');

  const alpha = (_ => {
    const end = 'z'.charCodeAt(0);
    let i = 'A'.charCodeAt(0);
    const arr = [];
    for (; i <= end; i++) {
      arr.push(String.fromCharCode(i));
    }
    return arr;
  })();

  const length = alpha.length;
  Symbol = s => s + alpha.map(_ => alpha[Math.random() * length | 0]);
  Symbol.iterator = _ => { throw NO_SYMBOL; };
}

const compose = (...fs) => x => fs.reduceRight((result, f) => {
  return f(result);
}, x);

const exists = x => x != null;

const DONE = Symbol('reduced value');

class _Wrapped {
  constructor (val) { this[DONE] = val }
};

const isReduced = a => a instanceof _Wrapped;
const reduced = a => a instanceof _Wrapped ? a : new _Wrapped(a);
const unWrap = a => a[DONE];
const reduce = (reducer, coll, init) => {
  const nativeReduce = ['fold', 'foldl', 'reduce'].filter(s => coll[s] !== undefined)[0];
  const args = [reducer, init].filter(exists);
  if (nativeReduce) return coll[nativeReduce].apply(coll, args);
  let results = [];
  if (typeof coll[Symbol.iterator] === 'function') {
    results = [...coll];
    return results.reduce.apply(results, args);
  }

  if (typeof coll.forEach === 'function') {
    coll.forEach(v => results.push(v));
    return results;
  }

  throw NON_ITER;
};

const factory = (process, initState) => xform => (reducer, coll) => {
  let state = typeof initState === 'function' ? initState() : initState;
  if (coll === undefined) { // return transducer
    return (accum, input) => {
      if (accum === undefined || accum === null) return reducer();
      if (isReduced(accum)) return unWrap(accum);
      return process(xform, reducer, accum, input, state);
    };
  } else if (typeof coll[Symbol.iterator] === 'function') {
    const result = [];
    for (let val of coll) {
      process(xform, reducer, result, val, state);
    }
    return result;
  } else {
    throw NON_ITER;
  }
};

const reduceStep = (xform, reducer, accum, input) => reducer(accum, input);

const filter = factory((predicate, reducer, accum, input) => {
  return predicate(input) ? reducer(accum, input) : accum;
});

const map = factory((xform, reducer, accum, input) => {
  return reducer(accum, xform(input));
});

const take = factory((n, reducer, accum, input, state) => {
  if (state > n) {
    return reduced(input);
  } else {
    state += 1;
  }
  return input;
}, () => 0);

const cat = reducer => (accum, input) => input.reduce(reducer, accum);
const mapcat = f => compose(cat, map(f));

const transduce = (xform, reducer, coll, init) => {
  let start = init === undefined ? reducer() : init;
  // TODO: reduce to handle nonArray, completion, early termination. Ditto cat.
  return coll.reduce(reducer(f), init);
};

const append = (arr, x) => {
  if (arr === undefined) return [];
  if (x === undefined) return arr;
  arr.push(x);
  return arr;
};

export {
  DONE,
  transduce,
  reduce,
  map,
  filter,
  cat,
  mapcat,
  take,
  append,
  compose,
};
