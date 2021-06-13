const t = require("tap");
const mergeDeepObjectParam = require("../lib/paramUtils").mergeDeepObjectParam;

t.test("deepObject parameters are correctly extracted", (t) => {
  t.plan(2);
  const ob = {
    "one[two][three]": 1,
    "four[five][six]": 2,
  };
  mergeDeepObjectParam(ob, "one");
  t.same(
    ob,
    { one: { two: { three: 1 } }, "four[five][six]": 2 },
    "selected deepObject parameters are extracted"
  );
  mergeDeepObjectParam(ob, "four");
  t.same(
    ob,
    { one: { two: { three: 1 } }, four: { five: { six: 2 } } },
    "all deepObject parameters are extracted"
  );
});

t.test("deepObject restores array type", (t) => {
  t.plan(2);
  const ob = {
    "arr[0]": 1,
  };
  mergeDeepObjectParam(ob, "arr");
  t.ok(Array.isArray(ob.arr), "deepObject preserves array type");
  t.same(ob, { arr: [1] }, "deepObject parameters are extracted");
});
