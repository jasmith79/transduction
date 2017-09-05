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

const exists = x => x != null;

const DONE = Symbol('reduced value');

class _Wrapped {
  constructor (val) { this[DONE] = val }
};

const isReduced = a => a instanceof _Wrapped;
const reduced = a => a instanceof _Wrapped ? a : new _Wrapped(a);
const unWrap = a => isReduced(a) ? a[DONE] : a;
const reduce = (reducer, coll, initial) => {
  const init = exists(initial) ? initial : reducer();
  const nativeReduce = ['fold', 'foldl', 'reduce'].filter(s => coll[s] !== undefined)[0];
  if (nativeReduce) return unWrap(coll[nativeReduce](reducer, init));
  if (typeof coll[Symbol.iterator] === 'function') {
    const iter = coll[Symbol.iterator]();
    let result = init;
    let val = iter.next();
    while (!val.done) {
      result = reducer(result, val.value);
      if (isReduced(result)) break;
      val = iter.next();
    }
    return result;
  }

  throw NON_ITER;
};

/*
 * compose
 * @variadic
 *
 * Takes any number of functions and returns a function that takes an argument
 * and applies the functions in succession from right to left. All supplied
 * functions should be unary.
 *
 * NOTE: you can compose Transducers using your own compose (e.g. lodash or 
 * Ramda's `compose`) but you will need to make sure the last function called
 * (first passed) is unWrap: this is necessary to preserve the bubbling
 * semantics of completion for composed transducers.
 */
const compose = (...fs) => x => unWrap(fs.reduceRight((result, f) => {
  return f(result);
}, x));


const enforceArgumentContract = f => (xform, reducer, accum, input, state) => {
  // initialization
  if (!exists(input)) return reducer();
  // Early termination, bubble
  if (isReduced(accum)) return accum;
  return f(xform, reducer, accum, input, state);
};

/*
 * factory
 *
 * Helper for creating transducers.
 *
 * Takes a step process, intial state and returns a function that takes a
 * transforming function which returns a transducer takes a reducing function,
 * optional collection, optional initial value. If collection is not passed
 * returns a modified reducing function, otherwise reduces the collection.
 *
 * NOTE: factory attempts to consume the entire iterable and should not be
 * passed an infinite collection. The transducers returned however may be
 * combined with a lazy infinite collection.
 */
const factory = (process, initState) => xform => (reducer, coll, initValue) => {
  let state = {};
  state.value = typeof initState === 'function' ? initState() : initState;
  let step = enforceArgumentContract(process);
  let trans = (accum, input) => step(xform, reducer, accum, input, state);
  if (coll === undefined) {
    return trans; // return transducer
  } else if (typeof coll[Symbol.iterator] === 'function') {
    return unWrap(reduce(...[trans, coll, initValue].filter(exists))); 
  } else {
    throw NON_ITER;
  }
};

const filter = factory((predicate, reducer, accum, input) => {
  return predicate(input) ? reducer(accum, input) : accum;
});

const map = factory((xform, reducer, accum, input) => {
  return reducer(accum, xform(input));
});

const take = factory((n, reducer, accum, input, state) => {
  if (state.value >= n) {
    return reduced(accum);
  } else {
    state.value += 1;
  }
  return reducer(accum, input);
}, () => 0);

const cat = reducer => (accum, input) => reduce(reducer, input, accum);
const mapcat = f => compose(cat, map(f));

const transduce = (xform, reducer, coll, init) => {
  let start = init === undefined ? reducer() : init;
  return reduce(xform(reducer), coll, init); 
};

const addArities = (defaultValue, reducer) => (...args) => {
  switch (args.length) {
    case 0: return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    case 1: return args[0];
    default: return reducer(...args);
  }
};

const append = addArities(() => { return [] }, (arr, input) => {
  let result = Array.isArray(arr) ? arr : [arr];
  result.push(input);
  return result;
});

const sum = addArities(0, (a, b) => a + b);

export {
  transduce,
  reduce,
  isReduced,
  unWrap,
  map,
  filter,
  cat,
  mapcat,
  take,
  append,
  compose,
  sum,
  addArities,
};
