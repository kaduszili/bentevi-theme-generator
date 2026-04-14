import test from "node:test";
import assert from "node:assert/strict";
import { discoverAssets } from "./asset-discovery";

test("discoverAssets resolves favicon and logo URLs", async () => {
  const page = {
    url: () => "https://example.com/pricing",
    title: async () => "Example",
    evaluate: async <T>() =>
      ({
      faviconCandidates: ["/favicon.ico"],
      logos: [
        {
          src: "/images/logo.svg",
          alt: "Example logo",
          width: 140,
          height: 40,
          className: "site-logo",
          id: "",
          areaRole: "header",
          textHint: "Example",
          visible: true,
        },
      ],
      brandNameHint: "Example",
    }) as T,
  };

  const result = await discoverAssets(page);
  assert.equal(result.faviconUrl, "https://example.com/favicon.ico");
  assert.equal(result.logoUrl, "https://example.com/images/logo.svg");
  assert.equal(result.brandNameHint, "Example");
});
