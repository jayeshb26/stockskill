const _ = require("lodash");

let res = [
  3, 4, 2, 4, 24, 15, 13, 24, 23, 24, 2, 34, 12, 3, 25, 23, 35, 26, 5, 7, 6, 2,
  34, 4,
];

let data = {};
for (let element of res) {
  data[element] = data[element] ? data[element] + 1 : 1;
}
console.log(data);

let data2 = sortObject(data);
console.log(data2);
let cool = [];
let hot = [];
for (let i = 0; i < 5; i++) {
  cool.push(Object.keys(data2[i])[0]);
  hot.push(Object.keys(data2[data2.length - (i + 1)])[0]);
}
console.log("cool", cool);
console.log("hot", hot);
