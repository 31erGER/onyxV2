import workflowItemValidor from "../shared/WorkflowItemValidator";
import { isValidWorkflowDuration } from "../../../services/utils";

export default function WorkflowConfigValidator(workflowConfig) {
  if (!Array.isArray(workflowConfig?.items) ||
      !isValidWorkflowDuration(workflowConfig.fanOnGlobal)) {
    return false;
  }

  try {
    for (let i = 0; i < workflowConfig.items.length; i++) {
      const currentWorkflow = workflowConfig.items[i];
      if (
        !currentWorkflow.hasOwnProperty("id") ||
        !currentWorkflow.hasOwnProperty("name") ||
        !currentWorkflow.hasOwnProperty("payload")
      ) {
        return false;
      }

      if (
        currentWorkflow.payload.some((item) => {
          if (typeof item?.payload !== "number" &&
              ["wait", "fanOn", "exitWorkflowWhenTargetTemperatureIs", "setLEDbrightness"].includes(item?.type)) return true;
          if (item?.type === "heatOn" && item.payload !== "" && item.payload !== null &&
              typeof item.payload !== "number") return true;
          // JSON always stores Celsius; only the interactive editor uses isF.
          if (!workflowItemValidor(item, false)) {
            return true;
          }
          return false;
        })
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
