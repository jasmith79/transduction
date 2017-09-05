/*
 * test.js
 * @author jasmith79
 * @license MIT
 * @copyright Jared Adam Smith, 2017
 *
 * Test file for transduction.js
 */

import {
  transduce,
  isReduced,
  unWrap,
  reduce,
  map,
  filter,
  cat,
  mapcat,
  take,
  append,
  compose,
  sum,
  addArities,
} from '../src/transduction.js';

let isEven = n => !(n % 2);
let double = n => n * 2;
let add3 = n => n + 3;

/******** Compose tests ********/

// This is just for correct generic function composition, will test
// Transducer composition below.

let add3AndDouble = compose(double, add3);
console.assert(add3AndDouble(1) === 8);

/******** Append tests *********/

let arr = [1];
console.assert(Array.isArray(append()) && !append().length);
console.assert(append(arr) === arr && arr.length === 1);
console.assert(append(arr, 2).toString() === '1,2');

/******** Cat tests ************/

arr = [[1],[2]];
console.assert(arr.reduce(cat(append), []).toString() === '1,2');

/******** Map Tests ************/

let mapDouble = map(double);
let six = [1,2].reduce(mapDouble((a, b) => { return a + b; }), 0);
console.assert(six === 6, six);

/******** Reduce tests *********/

let val = reduce(mapDouble(append), [1,2,3], []);
console.assert(val.toString() === '2,4,6', val);
let foo = {};
foo[Symbol.iterator] = function* () {
  yield 1;
  yield 2;
  yield 3;
};

val = reduce(mapDouble(append), foo, []);
console.assert(val.toString() === '2,4,6', val);

console.assert(reduce((a, b) => { return a + b; }, [1,2,3], 0) === 6);

/******* Filter tests ***********/ 

let onlyEven = filter(isEven);
console.assert([1,2,3].reduce(onlyEven(append), []).toString() === '2');

/******* Cat tests **************/

console.assert([[1], [2], [3]].reduce(cat(append), []).toString() === '1,2,3');

/******* Take tests *************/

let onetwo = unWrap([1,2,3].reduce(take(2)(append), []));
console.assert(onetwo.toString() === '1,2', onetwo);

let twofour = [1,2].reduce(compose(mapDouble, take(2))(append), []).toString();
console.assert(twofour === '2,4', twofour);

/******* Reduce tests **********/

// equivalent to native
let native = [1,2,3].reduce(sum);
let r = reduce(sum, [1,2,3]); 
console.assert(native === r && r === 6, [native, r]);

// handles lack of initial value
console.assert(reduce(mapDouble(sum), [1,2]) === 6);

// preserves early termination
let called = 0;
let updatesCalled = map(a => { called += 1; return a; });
let hasTwo = reduce(compose(take(2), updatesCalled)(append), [1,2,3]).toString();
console.assert(hasTwo === '1,2', hasTwo);
console.assert(called === 2, called);

/****** Transduce tests *******/

console.assert(transduce(mapDouble, sum, [1,2]) === 6);

console.log('all tests complete');
