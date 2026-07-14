import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { WriteNewConfigToLocalStorage } from "../../../services/utils";
import { setTemperatureControls } from "../settingsSlice";
import { defaultTemperatureArray } from "../../../constants/constants";
import { useState } from "react";
import ModalWrapper from "../../shared/styledComponents/Modal";
import NeuButton from "../../shared/neumorphic/NeuButton";

export default function RestoreDefaultTemperature() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const config = useSelector((state) => state.settings.config);
  const handleClose = () => setShow(false);
  const handleShow = (e) => {
    e.preventDefault();
    setShow(true);
  };
  const dispatch = useDispatch();

  const resetConfigToDefaultTemperatures = () => {
    WriteNewConfigToLocalStorage({
      ...config,
      temperatureControlValues: [...defaultTemperatureArray],
    });
    dispatch(setTemperatureControls([...defaultTemperatureArray]));
  };
  const handleSave = () => {
    handleClose();
    resetConfigToDefaultTemperatures();
  };
  return (
    <>
      <NeuButton $danger onClick={handleShow}>{t("settings.temperatureControl.restoreDefaults")}</NeuButton>
      <ModalWrapper
        headerText={t("settings.temperatureControl.restoreDefaultTemperatures")}
        bodyText={t("settings.temperatureControl.restoreDefaultsConfirm")}
        confirmButtonText={t("settings.temperatureControl.saveChanges")}
        handleClose={handleClose}
        handleConfirm={handleSave}
        show={show}
      />
    </>
  );
}
