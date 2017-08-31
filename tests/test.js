/*
 * test.js
 * @author jasmith79
 * @license MIT
 * @copyright Jared Adam Smith, 2017
 *
 * Test file for transduction.js
 */

import {
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
} from '../src/transduction.js';

let isEven = n => !(n % 2);
let double = n => n * 2;
let doubleEven = compose(isEven, double);
console.assert([1,2,3].map(doubleEven).toString() === 'true,true,true');

let concat = (arr, x) => Array.isArray(arr) ? arr.push.apply(arr, x) : [];
let a = filter(isEven);
let b = map(double);
let mapDouble = map(double);
let one = a(append, [1,2,3]);
console.assert(one.toString() === '2');
 
let two = b(append, [1,2,3]);
console.assert(two.toString() === '2,4,6');
 
doubleEven = compose(a, b)(append);
let str = [1,2,3].reduce(doubleEven, []).toString();
console.assert([1,2,3].reduce(doubleEven, []).toString() === '4');
let flatdouble = mapcat(double)(append);
console.assert([[1],[2],[3]].reduce(flatdouble, []).toString() === '2,4,6');


/******** Append tests *********/

let arr = [1];
console.assert(Array.isArray(append()) && !append().length);
console.assert(append(arr) === arr && arr.length === 1);
console.assert(append(arr, 2).toString() === '1,2');

/******** Cat tests ************/

arr = [[1],[2]];
console.assert(arr.reduce(cat(append), []).toString() === '1,2');

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
































console.log('all tests complete');
