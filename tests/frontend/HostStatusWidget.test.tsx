import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@termix-ssh/plugin-sdk/frontend", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTranslation: () => ({ t: (key: string) => key, language: "en" }),
  useHost: () => ({ id: 1, name: "nas" }),
  useHostStatus: () => ({ status: "online" }),
}));

import { HostStatusWidget } from "../../src/frontend/widgets/HostStatusWidget.js";
import type { CanvasWidget } from "../../src/frontend/types.js";

afterEach(cleanup);

const widget: CanvasWidget = {
  id: 1,
  typeId: "host_status",
  title: "NAS",
  config: {},
};

describe("HostStatusWidget metrics", () => {
  it("draws another plugin's values for the host, with the metrics asked for", async () => {
    const { renderWithApp } = await import("@termix-ssh/plugin-sdk/testing");
    const seen: Array<Record<string, unknown>> = [];
    const rendered = await renderWithApp(
      {
        activate(app) {
          app.registerSlotContribution("homepage.hostMetrics", {
            actionId: "metrics.home",
            titleKey: "x",
            kind: "data",
            useValue: (context) => {
              seen.push(context);
              return {
                shape: "bars",
                items: [{ label: "CPU", value: 0.3, detail: "4c" }],
              };
            },
          });
        },
      },
      { pluginId: "metrics" },
    );
    render(
      <HostStatusWidget
        widget={widget}
        config={{ hostId: 1, shownMetrics: ["cpu"] }}
      />,
    );
    expect(await screen.findByText("30%")).toBeTruthy();
    expect(seen.at(-1)).toMatchObject({
      hostId: 1,
      online: true,
      shownMetrics: ["cpu"],
    });
    await rendered.deactivate();
  });
});
