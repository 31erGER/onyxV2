import Contact from "./Contact";
import Div from "../shared/styledComponents/RootNonAppOutletDiv";
import Socials from "./Meta/Socials";
import PrideText from "../../themes/PrideText";
import NeuCard from "../shared/neumorphic/NeuCard";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

const ContactCard = styled(NeuCard)`
  max-width: 30rem;
  width: 100%;
  margin: 2rem auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ContactHeader = styled.div`
  text-align: center;

  h1 {
    margin-bottom: 12px;
    font-size: 2rem;
    font-weight: 700;
  }
`;

const ContactDescription = styled.p`
  color: ${(props) => props.theme.neumorphic.textSecondary};
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
`;

export default function ContactMe() {
  const { t } = useTranslation();

  return (
    <Div>
      <ContactCard>
        <ContactHeader>
          <h1>
            <PrideText text={t("contactPage.title")} />
          </h1>
          <ContactDescription>{t("contact.getInTouch")}</ContactDescription>
        </ContactHeader>

        <Socials />
        <Contact />
      </ContactCard>
    </Div>
  );
}
