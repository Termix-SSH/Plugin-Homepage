import { describe, expect, it } from "vitest";
import { renderWithApp } from "@termix-ssh/plugin-sdk/testing";
import * as plugin from "../../src/frontend/index";
import manifest from "../../manifest.json";
import { getWidgetType } from "../../src/frontend/widgets/WidgetRegistry";

function DockerWidget() {
  return <p>docker widget</p>;
}

describe("widgets from other plugins", () => {
  it("lists another plugin's widget with its view and sizes", async () => {
    const rendered = await renderWithApp(plugin, {
      manifest: manifest as never,
      others: {
        extensions: {
          "homepage.widgets": [
            {
              id: "docker",
              pluginId: "docker",
              name: "Docker",
              description: "Containers",
              category: "system",
              defaultConfig: {},
              defaultSize: { w: 4, h: 3 },
              minSize: { w: 2, h: 2 },
              components: { view: DockerWidget },
            },
          ],
        },
      },
    });
    const type = getWidgetType("docker" as never);
    expect(type?.name).toBe("Docker");
    expect(type?.defaultSize).toEqual({ w: 4, h: 3 });
    expect(type?.component).toBe(DockerWidget);
    await rendered.deactivate();
  });
});
