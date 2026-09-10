// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ThemeProvider } from "styled-components";
import VolcanoLoader from "./VolcanoLoader";
import store from "../../../store";
import createNeumorphicTheme from "../../../themes/neumorphic/createNeumorphicTheme";
import { setCurrentWorkflow, setCurrentWorkflowStepId } from "../../workflowEditor/workflowSlice";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

afterEach(() => {
  cleanup();
  store.dispatch(setCurrentWorkflow());
  store.dispatch(setCurrentWorkflowStepId());
});

it("uses the existing header circle for workflow steps and restores the idle circle on completion", () => {
  const { container } = render(
    <Provider store={store}>
      <ThemeProvider theme={createNeumorphicTheme("dark")}>
        <DndProvider backend={HTML5Backend}>
          <MemoryRouter><VolcanoLoader /></MemoryRouter>
        </DndProvider>
      </ThemeProvider>
    </Provider>
  );
  const workflow = { id: 90, name: "Evening", payload: [
    { type: "heatOn", payload: 190 }, { type: "fanOn", payload: 30 }, { type: "heatOff" },
  ] };
  act(() => {
    store.dispatch(setCurrentWorkflow(workflow));
    store.dispatch(setCurrentWorkflowStepId(1));
  });
  expect(container.querySelectorAll("svg.circular-chart")).toHaveLength(1);
  expect(container.querySelector("svg.circular-chart text").textContent).toBe("1/3");
  act(() => { store.dispatch(setCurrentWorkflowStepId(2)); });
  expect(container.querySelector("svg.circular-chart text").textContent).toBe("2/3");
  act(() => {
    store.dispatch(setCurrentWorkflow());
    store.dispatch(setCurrentWorkflowStepId());
  });
  expect(container.querySelectorAll("svg.circular-chart")).toHaveLength(1);
  expect(container.querySelector("svg.circular-chart text").textContent).not.toContain("/3");
  expect(document.querySelector('[data-tooltip="workflow-expanded"]')).toBeNull();
});
