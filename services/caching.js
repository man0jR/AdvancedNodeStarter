const mongoose = require("mongoose");
const Redis = require("ioredis");

const redis = new Redis();

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "default");
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    console.log("no cache used");
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });

  const cachedValue = await redis.hget(this.hashKey, key);
  //if cache present return from cache
  if (cachedValue) {
    const doc = JSON.parse(cachedValue);
    // console.log(doc);
    let result = Array.isArray(doc)
      ? doc.map((val) => new this.model(val))
      : new this.model(val);
    console.log("returning from cache");
    return result;
  }

  console.log("No cache found");

  let result = await exec.apply(this, arguments);

  await redis.hset(this.hashKey, key, JSON.stringify(result));

  return result;
};

async function clearCache(hashKey) {
  console.log(hashKey);
  await redis.del(JSON.stringify(hashKey));
}

module.exports = { clearCache };
