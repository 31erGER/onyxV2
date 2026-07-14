import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { setLanguage } from "../settingsSlice";
import SettingsItem from "../SettingsItem";
import Select from "react-bootstrap/FormSelect";
import styled from "styled-components";
import { useEffect } from "react";
import { SUPPORTED_LANGUAGES } from "../../../services/utils";

const StyledSelect = styled(Select)`
  max-width: 250px;
  background-color: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  border: none;
  box-shadow: ${(props) => props.theme.neumorphic.pressed};
  border-radius: 12px;
  background-image: ${(p) =>
    `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='${encodeURIComponent(
      p.theme.neumorphic.text
    )}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E")`};
`;

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const storedLanguage = useSelector((state) => state.settings.language);
  const config = useSelector((state) => state.settings.config);

  // Initialize language from stored config on mount
  useEffect(() => {
    if (config?.language && config.language !== storedLanguage) {
      dispatch(setLanguage(config.language));
      if (config.language !== 'default') {
        i18n.changeLanguage(config.language);
      }
    }
  }, [config?.language, storedLanguage, dispatch, i18n]);

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    dispatch(setLanguage(selectedLanguage));
    
    if (selectedLanguage === 'default') {
      // Use browser language detection
      const browserLanguage = navigator.language.split('-')[0];
      const languageToUse = SUPPORTED_LANGUAGES.includes(browserLanguage) ? browserLanguage : 'en';
      i18n.changeLanguage(languageToUse);
    } else {
      i18n.changeLanguage(selectedLanguage);
    }
  };

  const getCurrentValue = () => {
    return storedLanguage || 'default';
  };

  return (
    <SettingsItem
      title={t('settings.language.title')}
      description={t('settings.language.description')}
    >
      <StyledSelect
        value={getCurrentValue()}
        onChange={handleLanguageChange}
      >
        <option value="default">{t('settings.language.default')}</option>
        <option value="en">{t('settings.language.english')}</option>
        <option value="fr">{t('settings.language.french')}</option>
        <option value="es">{t('settings.language.spanish')}</option>
        <option value="de">{t('settings.language.german')}</option>
        <option value="pl">{t('settings.language.polish')}</option>
        <option value="binary">{t('settings.language.binary')}</option>
        <option value="elvish">{t('settings.language.elvish')}</option>
      </StyledSelect>
    </SettingsItem>
  );
}