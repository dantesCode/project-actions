import * as assert from "assert";
import { detectors } from "../../detectors";

suite("detectors async", () => {
  for (const detector of detectors) {
    test(`${detector.id} returns array`, async () => {
      const result = await detector.detect("/nonexistent");
      assert.ok(Array.isArray(result));
    });
  }
});
