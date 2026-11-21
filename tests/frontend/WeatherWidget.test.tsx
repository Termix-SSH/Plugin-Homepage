import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const get = vi.hoisted(() => vi.fn());

vi.mock("@termix-ssh/plugin-sdk/frontend", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTranslation: () => ({ t: (key: string) => key, language: "en" }),
  usePluginApi: () => ({ get }),
}));

import { WeatherWidget } from "../../src/frontend/widgets/WeatherWidget.js";
import type { CanvasWidget } from "../../src/frontend/types.js";

afterEach(cleanup);

const widget: CanvasWidget = {
  id: 1,
  typeId: "weather",
  title: "Weather",
  config: {},
};

describe("WeatherWidget", () => {
  it("asks the plugin's server for the forecast instead of fetching wttr.in itself", async () => {
    const direct = vi.spyOn(globalThis, "fetch");
    get.mockResolvedValue({
      data: {
        nearest_area: [{ areaName: [{ value: "Paris" }], country: [] }],
        current_condition: [
          {
            temp_C: "12",
            FeelsLikeC: "10",
            weatherDesc: [{ value: "Clear" }],
            weatherCode: "113",
          },
        ],
        weather: [],
      },
    });

    render(
      <WeatherWidget
        widget={widget}
        config={{ location: "Paris", unit: "C", showForecast: false }}
      />,
    );

    expect(await screen.findByText("12°C")).toBeTruthy();
    expect(get).toHaveBeenCalledWith("/proxy", {
      params: { url: "https://wttr.in/Paris?format=j1", ttl: 600 },
    });
    expect(direct).not.toHaveBeenCalled();
  });
});
