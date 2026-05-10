import arcjet, {shield, detectBot, tokenBucket} from "@arcjet/node";

import {env} from "./env";

const aj = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    shield({mode: "LIVE"}),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,
      interval: 10,
      capacity: 10,
    }),
  ],
});

export default aj;
